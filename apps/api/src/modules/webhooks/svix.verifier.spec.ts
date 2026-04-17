import { createHmac } from 'crypto';
import { SvixVerifier, SvixVerificationError } from './svix.verifier';

describe('SvixVerifier', () => {
  const verifier = new SvixVerifier();
  const rawSecret = Buffer.from('topsecretkey').toString('base64');
  const secret = `whsec_${rawSecret}`;

  function sign(id: string, ts: string, payload: string, sec = secret) {
    const key = Buffer.from(
      sec.startsWith('whsec_') ? sec.slice('whsec_'.length) : sec,
      'base64',
    );
    const sig = createHmac('sha256', key).update(`${id}.${ts}.${payload}`).digest('base64');
    return `v1,${sig}`;
  }

  it('accepts a valid signed payload', () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({ event: 'payment.settled' });
    const signature = sign('msg_1', ts, body);

    expect(() =>
      verifier.verify(body, { id: 'msg_1', timestamp: ts, signature }, secret),
    ).not.toThrow();
  });

  it('rejects a tampered body', () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const originalBody = JSON.stringify({ event: 'payment.settled', amount: 100 });
    const signature = sign('msg_1', ts, originalBody);
    const tamperedBody = JSON.stringify({ event: 'payment.settled', amount: 999 });

    expect(() =>
      verifier.verify(tamperedBody, { id: 'msg_1', timestamp: ts, signature }, secret),
    ).toThrow(SvixVerificationError);
  });

  it('rejects a timestamp outside the 5-minute skew window', () => {
    const ts = String(Math.floor(Date.now() / 1000) - 6 * 60);
    const body = '{}';
    const signature = sign('msg_1', ts, body);

    expect(() =>
      verifier.verify(body, { id: 'msg_1', timestamp: ts, signature }, secret),
    ).toThrow(/outside tolerance/);
  });

  it('rejects when signed with the wrong secret', () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const body = '{}';
    const wrongSecret = `whsec_${Buffer.from('wrongkey').toString('base64')}`;
    const signature = sign('msg_1', ts, body, wrongSecret);

    expect(() =>
      verifier.verify(body, { id: 'msg_1', timestamp: ts, signature }, secret),
    ).toThrow(/signature mismatch/);
  });

  it.each([
    ['id', { id: '', timestamp: '1', signature: 'v1,x' }],
    ['timestamp', { id: 'x', timestamp: '', signature: 'v1,x' }],
    ['signature', { id: 'x', timestamp: '1', signature: '' }],
  ])('rejects missing svix-%s header', (_label, headers) => {
    expect(() => verifier.verify('{}', headers, secret)).toThrow(SvixVerificationError);
  });

  it('rejects when no v1 signatures present', () => {
    const ts = String(Math.floor(Date.now() / 1000));
    expect(() =>
      verifier.verify('{}', { id: 'x', timestamp: ts, signature: 'v2,abc' }, secret),
    ).toThrow(/no v1 signatures/);
  });

  it('accepts any of multiple space-separated signatures', () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const body = '{}';
    const realSig = sign('msg_1', ts, body);
    const decoySig = 'v1,notavalidsignature';
    const signature = `${decoySig} ${realSig}`;

    expect(() =>
      verifier.verify(body, { id: 'msg_1', timestamp: ts, signature }, secret),
    ).not.toThrow();
  });
});

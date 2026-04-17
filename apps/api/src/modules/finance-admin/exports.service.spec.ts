import { FinanceExportsService } from './exports.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FinanceExportsService.toCsv', () => {
  let svc: FinanceExportsService;

  beforeEach(() => {
    // Serializer tests don't touch the DB — prisma is irrelevant here.
    svc = new FinanceExportsService({} as PrismaService);
  });

  it('emits a plain header + row with CRLF line terminators', () => {
    const out = svc.toCsv(
      [{ a: 'x', b: 'y' }],
      [
        { key: 'a', header: 'A' },
        { key: 'b', header: 'B' },
      ],
    );
    expect(out).toBe('A,B\r\nx,y\r\n');
  });

  it('quotes fields containing commas', () => {
    const out = svc.toCsv(
      [{ name: 'Smith, John' }],
      [{ key: 'name', header: 'name' }],
    );
    expect(out).toBe('name\r\n"Smith, John"\r\n');
  });

  it('escapes embedded double-quotes by doubling them (RFC 4180)', () => {
    const out = svc.toCsv(
      [{ note: 'He said "hi"' }],
      [{ key: 'note', header: 'note' }],
    );
    expect(out).toBe('note\r\n"He said ""hi"""\r\n');
  });

  it('quotes fields containing newlines', () => {
    const out = svc.toCsv(
      [{ body: 'line1\nline2' }],
      [{ key: 'body', header: 'body' }],
    );
    expect(out).toBe('body\r\n"line1\nline2"\r\n');
  });

  it('quotes fields containing carriage returns', () => {
    const out = svc.toCsv(
      [{ body: 'a\rb' }],
      [{ key: 'body', header: 'body' }],
    );
    expect(out).toBe('body\r\n"a\rb"\r\n');
  });

  it('emits empty string for null and undefined', () => {
    const out = svc.toCsv(
      [{ a: null, b: undefined, c: 'x' }],
      [
        { key: 'a', header: 'a' },
        { key: 'b', header: 'b' },
        { key: 'c', header: 'c' },
      ],
    );
    expect(out).toBe('a,b,c\r\n,,x\r\n');
  });

  it('serializes bigint as an integer string (cents)', () => {
    const out = svc.toCsv(
      [{ amt: 123_456_789_012_345n }],
      [{ key: 'amt', header: 'amountCents' }],
    );
    expect(out).toBe('amountCents\r\n123456789012345\r\n');
  });

  it('serializes Date as ISO-8601 string', () => {
    const d = new Date('2026-04-15T10:20:30.000Z');
    const out = svc.toCsv([{ t: d }], [{ key: 't', header: 't' }]);
    expect(out).toBe('t\r\n2026-04-15T10:20:30.000Z\r\n');
  });

  it('handles the combined torture case: comma + quote + newline + bigint + null', () => {
    const out = svc.toCsv(
      [{ s: 'a,"b"\nc', n: 10n, x: null }],
      [
        { key: 's', header: 's' },
        { key: 'n', header: 'n' },
        { key: 'x', header: 'x' },
      ],
    );
    expect(out).toBe('s,n,x\r\n"a,""b""\nc",10,\r\n');
  });

  it('supports value-extractor functions for computed columns', () => {
    const out = svc.toCsv(
      [{ first: 'Ada', last: 'Lovelace' }],
      [
        {
          key: 'fullName',
          header: 'fullName',
          value: (r) => `${r.first} ${r.last}`,
        },
      ],
    );
    expect(out).toBe('fullName\r\nAda Lovelace\r\n');
  });

  it('emits header-only (plus trailing CRLF) when rows is empty', () => {
    const out = svc.toCsv([], [{ key: 'a', header: 'A' }]);
    expect(out).toBe('A\r\n');
  });
});

'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { useCreateConversation, useSearchUsers } from '@/hooks/useInbox';
import { useAuth } from '@/hooks/useAuth';
import { ConversationContext, INBOX_CONSTANTS } from '@social-bounty/shared';
import type { UserSearchResult } from '@social-bounty/shared';

interface NewConversationDialogProps {
  visible: boolean;
  onHide: () => void;
  onCreated: (conversationId: string) => void;
}

const contextOptions = [
  { label: 'General Support', value: ConversationContext.SUPPORT },
  { label: 'About a Bounty', value: ConversationContext.BOUNTY },
  { label: 'About a Submission', value: ConversationContext.SUBMISSION },
  { label: 'About an Application', value: ConversationContext.APPLICATION },
  { label: 'About an Invitation', value: ConversationContext.INVITATION },
];

export function NewConversationDialog({ visible, onHide, onCreated }: NewConversationDialogProps) {
  const { user } = useAuth();
  const createConversation = useCreateConversation();

  const [context, setContext] = useState<ConversationContext>(ConversationContext.SUPPORT);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<UserSearchResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: searchResults, isLoading: isSearching } = useSearchUsers(recipientSearch);
  const searchRef = useRef<HTMLDivElement>(null);

  // Filter out current user from results
  const filteredResults = (searchResults ?? []).filter((u) => u.id !== user?.id);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetForm = () => {
    setContext(ConversationContext.SUPPORT);
    setSubject('');
    setMessage('');
    setRecipientSearch('');
    setSelectedRecipient(null);
    setShowDropdown(false);
  };

  const handleClose = () => {
    resetForm();
    onHide();
  };

  const handleSubmit = () => {
    if (!selectedRecipient || !subject.trim() || !message.trim()) return;

    createConversation.mutate(
      {
        context,
        subject: subject.trim(),
        initialMessage: message.trim(),
        participantIds: [selectedRecipient.id],
      },
      {
        onSuccess: (data) => {
          resetForm();
          onCreated(data.id);
        },
      },
    );
  };

  const selectRecipient = (user: UserSearchResult) => {
    setSelectedRecipient(user);
    setRecipientSearch(`${user.firstName} ${user.lastName}`);
    setShowDropdown(false);
  };

  const clearRecipient = () => {
    setSelectedRecipient(null);
    setRecipientSearch('');
  };

  const canSubmit = selectedRecipient && subject.trim().length > 0 && message.trim().length > 0;

  const footer = (
    <div className="flex justify-end gap-3">
      <Button
        label="Cancel"
        outlined
        severity="secondary"
        onClick={handleClose}
        disabled={createConversation.isPending}
      />
      <Button
        label="Send Message"
        icon="pi pi-send"
        onClick={handleSubmit}
        disabled={!canSubmit}
        loading={createConversation.isPending}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={handleClose}
      header="New Conversation"
      modal
      closable
      className="w-full max-w-lg"
      footer={footer}
    >
      <div className="space-y-4">
        {/* Recipient Search */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            To <span className="text-accent-rose">*</span>
          </label>
          <div className="relative" ref={searchRef}>
            {selectedRecipient ? (
              <div className="flex items-center gap-2 glass-input px-3 py-2 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-accent-cyan/20 text-accent-cyan flex items-center justify-center text-xs font-semibold">
                  {selectedRecipient.firstName[0]}{selectedRecipient.lastName[0]}
                </div>
                <span className="text-sm text-text-primary flex-1">
                  {selectedRecipient.firstName} {selectedRecipient.lastName}
                </span>
                <span className="text-xs text-text-muted">{selectedRecipient.email}</span>
                <button
                  onClick={clearRecipient}
                  className="text-text-muted hover:text-text-primary p-1 cursor-pointer"
                  aria-label="Clear recipient"
                >
                  <i className="pi pi-times text-xs" />
                </button>
              </div>
            ) : (
              <>
                <span className="p-input-icon-left w-full">
                  <i className={isSearching ? 'pi pi-spinner pi-spin' : 'pi pi-search'} />
                  <InputText
                    value={recipientSearch}
                    onChange={(e) => {
                      setRecipientSearch(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => recipientSearch.length >= 2 && setShowDropdown(true)}
                    placeholder="Search by name or email..."
                    className="w-full"
                    aria-label="Search for recipient"
                  />
                </span>
                {showDropdown && recipientSearch.length >= 2 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 glass-card border border-glass-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredResults.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-text-muted">
                        {isSearching ? 'Searching...' : 'No users found'}
                      </div>
                    ) : (
                      filteredResults.map((u) => (
                        <button
                          key={u.id}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-elevated/60 transition-colors text-left cursor-pointer"
                          onClick={() => selectRecipient(u)}
                        >
                          <div className="w-8 h-8 rounded-full bg-accent-violet/20 text-accent-violet flex items-center justify-center text-xs font-semibold shrink-0">
                            {u.firstName[0]}{u.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-text-primary truncate">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-xs text-text-muted truncate">{u.email}</p>
                          </div>
                          <span className="text-[10px] text-text-muted bg-elevated px-1.5 py-0.5 rounded">
                            {u.role.replace('_', ' ')}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Context */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Category
          </label>
          <Dropdown
            value={context}
            options={contextOptions}
            onChange={(e) => setContext(e.value)}
            className="w-full"
            aria-label="Conversation category"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Subject <span className="text-accent-rose">*</span>
          </label>
          <InputText
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What's this about?"
            maxLength={200}
            className="w-full"
            aria-label="Conversation subject"
          />
          <p className="text-xs text-text-muted mt-1 text-right">{subject.length}/200</p>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Message <span className="text-accent-rose">*</span>
          </label>
          <InputTextarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message..."
            rows={4}
            maxLength={INBOX_CONSTANTS.MAX_MESSAGE_LENGTH}
            className="w-full"
            aria-label="Initial message"
            autoResize
          />
          <p className="text-xs text-text-muted mt-1 text-right">
            {message.length}/{INBOX_CONSTANTS.MAX_MESSAGE_LENGTH}
          </p>
        </div>

        {createConversation.isError && (
          <div className="flex items-center gap-2 text-accent-rose text-sm">
            <i className="pi pi-exclamation-circle" />
            <span>{(createConversation.error as Error)?.message || 'Failed to create conversation'}</span>
          </div>
        )}
      </div>
    </Dialog>
  );
}

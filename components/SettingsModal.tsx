'use client';

import Modal from './Modal';
import { useTheme } from './ThemeProvider';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const darkMode = theme === 'dark';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        {/* Profile Section */}
        <div>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Profile</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-muted mb-1">Display Name</label>
              <input
                type="text"
                placeholder="Your name"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:focus:border-primary-light"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                disabled
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted/10 text-muted text-sm cursor-not-allowed dark:bg-navy-light/20"
              />
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">
            Appearance
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground dark:text-muted">Dark Mode</span>
              <button
                type="button"
                onClick={() => setTheme(darkMode ? 'light' : 'dark')}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  darkMode ? 'bg-primary' : 'bg-border'
                }`}
                role="switch"
                aria-checked={darkMode}
                aria-label="Dark mode"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    darkMode ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/5 dark:hover:bg-navy-light/20 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors dark:bg-primary-light dark:hover:bg-primary">
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}

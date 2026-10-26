// MegaMenu stories — hover or click a root item to open the multi-column panel.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '../icons/index.js';
import { MegaMenu, type MegaMenuItem } from './index';

const meta = { title: 'Navigation/MegaMenu', component: MegaMenu, tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj;

const PROJECTS: MegaMenuItem = {
  key: 'projects',
  label: 'Projects',
  children: [
    {
      key: 'work',
      label: 'Workspaces',
      items: [
        { key: 'tasks', label: 'Tasks board' },
        { key: 'activity', label: 'Activity feed' },
        { key: 'timesheet', label: 'Timesheet' },
      ],
    },
    {
      key: 'insights',
      label: 'Insights',
      items: [
        { key: 'charts', label: 'Charts' },
        { key: 'reports', label: 'Reports' },
      ],
    },
    {
      key: 'admin',
      label: 'Administration',
      items: [
        { key: 'members', label: 'Members' },
        { key: 'webhooks', label: 'Webhooks' },
        { key: 'audit', label: 'Audit log' },
      ],
    },
  ],
};

/** Basic — hover or click "Projects" for a 3-column panel; ESC / outside click / leaf click close it. */
export const Basic: Story = {
  render: () => (
    <MegaMenu
      items={[
        PROJECTS,
        { key: 'docs', label: 'Docs', onClick: () => window.console.log('docs') },
        { key: 'about', label: 'About', onClick: () => window.console.log('about') },
      ]}
    />
  ),
};

/** WithIcons — root items and leaves carry icons from the kit set. */
export const WithIcons: Story = {
  render: () => (
    <MegaMenu
      items={[
        {
          key: 'workspace',
          label: 'Workspace',
          icon: <Icon name="home" size={14} className="mr-1.5 inline-block text-accent" />,
          children: [
            {
              key: 'build',
              label: 'Build',
              items: [
                { key: 'board', label: 'Board', icon: <Icon name="menu-bars" size={14} className="text-ink3" /> },
                { key: 'calendar', label: 'Calendar', icon: <Icon name="calendar" size={14} className="text-ink3" /> },
                { key: 'clock', label: 'Time tracking', icon: <Icon name="clock" size={14} className="text-ink3" /> },
              ],
            },
            {
              key: 'people',
              label: 'People',
              items: [
                { key: 'users', label: 'Members', icon: <Icon name="users" size={14} className="text-ink3" /> },
                { key: 'bell', label: 'Notifications', icon: <Icon name="bell" size={14} className="text-ink3" /> },
              ],
            },
          ],
        },
        { key: 'help', label: 'Help', onClick: () => window.console.log('help') },
      ]}
    />
  ),
};

/** DangerItems — destructive leaves render red (hover keeps the fail tint). */
export const DangerItems: Story = {
  render: () => (
    <MegaMenu
      items={[
        {
          key: 'project',
          label: 'Project X',
          children: [
            {
              key: 'manage',
              label: 'Manage',
              items: [
                { key: 'rename', label: 'Rename…' },
                { key: 'archive', label: 'Archive' },
                { key: 'delete', label: 'Delete project', danger: true },
              ],
            },
          ],
        },
      ]}
    />
  ),
};

/** FlatBar — roots without children behave as plain links (no panel, role menu never rendered). */
export const FlatBar: Story = {
  render: () => (
    <MegaMenu
      items={[
        { key: 'overview', label: 'Overview', onClick: () => window.console.log('overview') },
        { key: 'board', label: 'Board', onClick: () => window.console.log('board') },
        { key: 'activity', label: 'Activity', onClick: () => window.console.log('activity') },
      ]}
    />
  ),
};

/** DarkTheme — panel + bar trên dark canvas (tokens cascade, không code riêng cho dark). */
export const DarkTheme: Story = {
  name: 'Dark theme — bar + panel on dark canvas',
  render: () => (
    <div data-bp-theme="dark" className="w-full rounded-xl bg-canvas p-4">
      <MegaMenu items={[PROJECTS]} className="rounded-lg" />
    </div>
  ),
};

/** CustomStyled — slots-wave classNames + style: `root` on the nav, `trigger` on
 * top-level buttons, `panel`/`group`/`groupLabel`/`leaf` reshape the hover
 * panel; `style` lands on the nav. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <MegaMenu
      style={{ padding: 8 }}
      classNames={{
        root: 'rounded-xl border border-dashed border-accent bg-accent/5',
        panel: 'rounded-2xl bg-s1',
        groupLabel: 'uppercase tracking-wide',
        leaf: 'rounded-full',
      }}
      items={[
        {
          key: 'platform',
          label: 'Platform',
          children: [
            {
              key: 'build',
              label: 'Build',
              items: [
                { key: 'services', label: 'Services' },
                { key: 'gateway', label: 'Gateway' },
              ],
            },
            {
              key: 'ship',
              label: 'Ship',
              items: [{ key: 'compose', label: 'Compose' }],
            },
          ],
        },
      ]}
    />
  ),
};

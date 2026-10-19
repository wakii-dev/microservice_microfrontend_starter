// Parity matrix antd→tokens: docs/parity-matrix.md
// Grid stories — Row/Col 24-col: basic spans, gutter, responsive, justify/align, wrap/nested.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Col, Row } from './index';

/** CSS-grid layout utility — columns, gap, span as props. */
const meta = { title: 'Primitives/Grid', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Box({ label, tall }: { label: string; tall?: boolean }) {
  return (
    <div
      className={`grid place-items-center rounded-lg border border-line bg-s3 text-label text-ink2 ${tall ? 'h-20' : 'h-12'}`}
    >
      {label}
    </div>
  );
}

export const Basic: Story = {
  name: 'Basic — 24-col spans',
  render: () => (
    <div className="flex flex-col gap-4">
      <Row>
        <Col span={24}>
          <Box label="span 24" />
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <Box label="span 12" />
        </Col>
        <Col span={12}>
          <Box label="span 12" />
        </Col>
      </Row>
      <Row>
        <Col span={8}>
          <Box label="span 8" />
        </Col>
        <Col span={8}>
          <Box label="span 8" />
        </Col>
        <Col span={8}>
          <Box label="span 8" />
        </Col>
      </Row>
      <Row>
        <Col span={6}>
          <Box label="span 6" />
        </Col>
        <Col span={6}>
          <Box label="span 6" />
        </Col>
        <Col span={6}>
          <Box label="span 6" />
        </Col>
        <Col span={6}>
          <Box label="span 6" />
        </Col>
      </Row>
    </div>
  ),
};

export const Gutter: Story = {
  name: 'Gutter — number vs [horizontal, vertical]',
  render: () => (
    <div className="flex flex-col gap-6">
      <Row gutter={16}>
        <Col span={8}>
          <Box label="gutter 16" />
        </Col>
        <Col span={8}>
          <Box label="gutter 16" />
        </Col>
        <Col span={8}>
          <Box label="gutter 16" />
        </Col>
      </Row>
      <Row gutter={[8, 16]}>
        <Col span={12}>
          <Box label="[8, 16] — horizontal 8, vertical 16" />
        </Col>
        <Col span={12}>
          <Box label="[8, 16] — horizontal 8, vertical 16" />
        </Col>
        <Col span={12}>
          <Box label="[8, 16] — horizontal 8, vertical 16" />
        </Col>
        <Col span={12}>
          <Box label="[8, 16] — horizontal 8, vertical 16" />
        </Col>
      </Row>
    </div>
  ),
};

export const Responsive: Story = {
  name: 'Responsive — span → sm → md → lg → xl (resize the preview)',
  render: () => (
    <Row gutter={[8, 8]}>
      <Col span={24} sm={12} md={8} lg={6} xl={4}>
        <Box label="24 / sm 12 / md 8 / lg 6 / xl 4" />
      </Col>
      <Col span={24} sm={12} md={8} lg={6} xl={4}>
        <Box label="24 / sm 12 / md 8 / lg 6 / xl 4" />
      </Col>
      <Col span={24} sm={24} md={8} lg={12} xl={16}>
        <Box label="24 / sm 24 / md 8 / lg 12 / xl 16" />
      </Col>
    </Row>
  ),
};

export const JustifyAlign: Story = {
  name: 'Justify & align — distribution + cross axis',
  render: () => (
    <div className="flex flex-col gap-4">
      {(['start', 'center', 'end', 'space-between'] as const).map((justify) => (
        <Row key={justify} justify={justify} className="rounded-lg bg-s2 p-2">
          <Col span={4}>
            <Box label={justify} />
          </Col>
          <Col span={4}>
            <Box label={justify} />
          </Col>
        </Row>
      ))}
      <Row align="center" className="rounded-lg bg-s2 p-2">
        <Col span={6}>
          <Box label="align center" tall />
        </Col>
        <Col span={6}>
          <Box label="align center" />
        </Col>
      </Row>
    </div>
  ),
};

export const WrapAndNested: Story = {
  name: 'Wrap & nested — col overflow wraps, Row inside Col',
  render: () => (
    <div className="flex flex-col gap-4">
      <Row gutter={[8, 8]}>
        {Array.from({ length: 5 }, (_, i) => (
          <Col key={i} span={6}>
            <Box label={`span 6 #${i + 1} — 5 cols wrap to 2 rows`} />
          </Col>
        ))}
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Box label="outer left" />
          <Row gutter={[8, 8]} className="mt-2">
            <Col span={12}>
              <Box label="nested 12" />
            </Col>
            <Col span={12}>
              <Box label="nested 12" />
            </Col>
          </Row>
        </Col>
        <Col span={12}>
          <Box label="outer right" />
          <div className="mt-2 flex gap-2">
            <Button type="primary" size="small">
              Action
            </Button>
            <Button size="small">Cancel</Button>
          </div>
        </Col>
      </Row>
    </div>
  ),
};

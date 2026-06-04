"use client";

import { useState } from "react";
import { Container } from "@/components/layout";
import {
  Button,
  Input,
  Textarea,
  Select,
  Modal,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Tag,
  Tooltip,
  Skeleton,
} from "@/components/ui";

const COLORS = [
  { name: "bt-blue", hex: "#0A84FF", className: "bg-ktf-blue" },
  { name: "bt-blue-deep", hex: "#0057D9", className: "bg-ktf-blue-deep" },
  {
    name: "bt-blue-pressed",
    hex: "#0047B3",
    className: "bg-ktf-blue-pressed",
  },
  { name: "bt-navy", hex: "#0B1F3A", className: "bg-ktf-navy" },
  { name: "bt-white", hex: "#FDFDFD", className: "bg-ktf-white border" },
  { name: "bt-surface", hex: "#F6F8FB", className: "bg-ktf-surface border" },
  { name: "bt-obsidian", hex: "#111318", className: "bg-ktf-obsidian" },
  { name: "bt-charcoal", hex: "#2A2F36", className: "bg-ktf-charcoal" },
];

const GRAYS = [
  { name: "gray-100", hex: "#F4F7FA", className: "bg-ktf-gray-100" },
  { name: "gray-200", hex: "#E8EDF3", className: "bg-ktf-gray-200" },
  { name: "gray-300", hex: "#D6DCE5", className: "bg-ktf-gray-300" },
  { name: "gray-400", hex: "#B3BCC8", className: "bg-ktf-gray-400" },
  { name: "gray-500", hex: "#8A94A3", className: "bg-ktf-gray-500" },
  { name: "gray-600", hex: "#66707D", className: "bg-ktf-gray-600" },
  { name: "gray-700", hex: "#49515C", className: "bg-ktf-gray-700" },
  { name: "gray-800", hex: "#2B313A", className: "bg-ktf-gray-800" },
  { name: "gray-900", hex: "#1A1D23", className: "bg-ktf-gray-900" },
];

const SEMANTIC = [
  { name: "Success", hex: "#12B76A", className: "bg-ktf-success" },
  { name: "Warning", hex: "#F5A524", className: "bg-ktf-warning" },
  { name: "Error", hex: "#E5484D", className: "bg-ktf-error" },
  { name: "Info", hex: "#0A84FF", className: "bg-ktf-info" },
];

const TYPE_SCALE = [
  {
    name: "Display",
    size: "3.75rem / 60px",
    className: "text-[3.75rem] leading-[1.1]",
  },
  { name: "H1", size: "3rem / 48px", className: "text-[3rem] leading-[1.25]" },
  {
    name: "H2",
    size: "2.25rem / 36px",
    className: "text-[2.25rem] leading-[1.25]",
  },
  {
    name: "H3",
    size: "1.875rem / 30px",
    className: "text-[1.875rem] leading-[1.25]",
  },
  {
    name: "H4",
    size: "1.5rem / 24px",
    className: "text-[1.5rem] leading-[1.375]",
  },
  {
    name: "H5",
    size: "1.25rem / 20px",
    className: "text-[1.25rem] leading-[1.375]",
  },
  {
    name: "Body Large",
    size: "1.125rem / 18px",
    className: "text-[1.125rem] leading-[1.625]",
  },
  { name: "Body", size: "1rem / 16px", className: "text-base leading-[1.625]" },
  {
    name: "Body Small",
    size: "0.875rem / 14px",
    className: "text-sm leading-[1.625]",
  },
  {
    name: "Caption",
    size: "0.75rem / 12px",
    className: "text-xs leading-[1.625]",
  },
];

const SELECT_OPTIONS = [
  { value: "starter", label: "Starter Plan" },
  { value: "professional", label: "Professional Plan" },
  { value: "enterprise", label: "Enterprise Plan" },
];

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [tags, setTags] = useState(["React", "Next.js", "TypeScript"]);

  return (
    <div className="py-16">
      <Container>
        <header className="mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-ktf-obsidian sm:text-5xl">
            Design System
          </h1>
          <p className="mt-4 text-lg text-ktf-gray-600 max-w-2xl">
            The Bespoke Technologies living style guide. All design tokens,
            colours, typography, and UI components in one place.
          </p>
        </header>

        {/* ---- Colours ---- */}
        <Section title="Brand Colours">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {COLORS.map((c) => (
              <ColorSwatch key={c.name} {...c} />
            ))}
          </div>
        </Section>

        <Section title="Gray Scale">
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-9">
            {GRAYS.map((c) => (
              <ColorSwatch key={c.name} {...c} small />
            ))}
          </div>
        </Section>

        <Section title="Semantic Colours">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {SEMANTIC.map((c) => (
              <ColorSwatch key={c.name} {...c} />
            ))}
          </div>
        </Section>

        {/* ---- Gradients ---- */}
        <Section title="Gradients">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GradientSwatch
              name="Brand Gradient"
              className="bg-gradient-to-r from-ktf-blue to-ktf-blue-deep"
            />
            <GradientSwatch
              name="Executive Gradient"
              className="bg-gradient-to-r from-ktf-navy via-ktf-blue-deep to-ktf-blue"
            />
            <GradientSwatch
              name="Premium Dark"
              className="bg-gradient-to-r from-ktf-obsidian to-ktf-navy"
            />
            <GradientSwatch
              name="Soft UI"
              className="bg-gradient-to-r from-ktf-white to-ktf-surface border"
            />
          </div>
        </Section>

        {/* ---- Typography ---- */}
        <Section title="Typography Scale">
          <div className="space-y-6">
            {TYPE_SCALE.map((t) => (
              <div
                key={t.name}
                className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6"
              >
                <div className="shrink-0 w-32 text-sm text-ktf-gray-500 font-mono">
                  {t.size}
                </div>
                <p className={`${t.className} font-semibold text-ktf-obsidian`}>
                  {t.name} — Bespoke Technologies
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* ---- Shadows ---- */}
        <Section title="Shadows">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {[
              "shadow-xs",
              "shadow-sm",
              "shadow-md",
              "shadow-lg",
              "shadow-xl",
              "shadow-2xl",
            ].map((s) => (
              <div
                key={s}
                className={`flex h-24 items-center justify-center rounded-xl bg-white ${s}`}
              >
                <span className="text-sm text-ktf-gray-600 font-mono">{s}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ---- Buttons ---- */}
        <Section title="Buttons">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="sm">
                Primary SM
              </Button>
              <Button variant="primary" size="md">
                Primary MD
              </Button>
              <Button variant="primary" size="lg">
                Primary LG
              </Button>
              <Button variant="primary" isLoading>
                Loading
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" size="sm">
                Secondary SM
              </Button>
              <Button variant="secondary" size="md">
                Secondary MD
              </Button>
              <Button variant="secondary" size="lg">
                Secondary LG
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="ghost" size="sm">
                Ghost SM
              </Button>
              <Button variant="ghost" size="md">
                Ghost MD
              </Button>
              <Button variant="ghost" size="lg">
                Ghost LG
              </Button>
            </div>
          </div>
        </Section>

        {/* ---- Form Controls ---- */}
        <Section title="Form Controls">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Full Name" placeholder="John Doe" />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              hint="We'll never share your email."
            />
            <Input
              label="Password"
              type="password"
              error="Password must be at least 8 characters."
            />
            <Select
              label="Plan"
              options={SELECT_OPTIONS}
              placeholder="Select a plan"
            />
            <div className="sm:col-span-2 lg:col-span-1">
              <Textarea
                label="Message"
                placeholder="Tell us about your project..."
              />
            </div>
          </div>
        </Section>

        {/* ---- Cards ---- */}
        <Section title="Cards">
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
                <CardDescription>
                  Default card variant with subtle shadow and hover elevation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ktf-gray-700">
                  Cards adapt to content and provide consistent container
                  styling.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
                <Button size="sm" variant="ghost">
                  Cancel
                </Button>
              </CardFooter>
            </Card>
            <Card variant="premium">
              <CardHeader>
                <Badge variant="info" size="sm">
                  Premium
                </Badge>
                <CardTitle>Premium Card</CardTitle>
                <CardDescription>
                  Elevated card with gradient background and brand-tinted
                  border.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ktf-gray-700">
                  Used for featured content, highlighted plans, or important
                  CTAs.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Upgrade</Button>
              </CardFooter>
            </Card>
          </div>
        </Section>

        {/* ---- Badges & Tags ---- */}
        <Section title="Badges & Tags">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <Tag
                  key={tag}
                  onRemove={() => setTags((p) => p.filter((t) => t !== tag))}
                >
                  {tag}
                </Tag>
              ))}
              <Tag variant="outline">Static Tag</Tag>
            </div>
          </div>
        </Section>

        {/* ---- Tooltip ---- */}
        <Section title="Tooltip">
          <div className="flex flex-wrap items-center gap-6">
            <Tooltip content="Top tooltip" side="top">
              <Button variant="secondary" size="sm">
                Hover (Top)
              </Button>
            </Tooltip>
            <Tooltip content="Bottom tooltip" side="bottom">
              <Button variant="secondary" size="sm">
                Hover (Bottom)
              </Button>
            </Tooltip>
            <Tooltip content="Left tooltip" side="left">
              <Button variant="secondary" size="sm">
                Hover (Left)
              </Button>
            </Tooltip>
            <Tooltip content="Right tooltip" side="right">
              <Button variant="secondary" size="sm">
                Hover (Right)
              </Button>
            </Tooltip>
          </div>
        </Section>

        {/* ---- Modal ---- */}
        <Section title="Modal / Dialog">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Confirm Action"
            description="This is a production modal dialog with backdrop blur and spring animation."
          >
            <div className="space-y-4">
              <Input label="Reason" placeholder="Enter a reason..." />
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={() => setModalOpen(false)}>
                  Confirm
                </Button>
              </div>
            </div>
          </Modal>
        </Section>

        {/* ---- Skeleton ---- */}
        <Section title="Skeleton Loaders">
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1 space-y-2">
                  <Skeleton width="60%" />
                  <Skeleton width="40%" />
                </div>
              </div>
              <div className="mt-4">
                <Skeleton variant="text" lines={3} />
              </div>
              <div className="mt-4">
                <Skeleton
                  variant="rectangular"
                  height={160}
                  className="w-full"
                />
              </div>
            </Card>
            <Card>
              <Skeleton variant="rectangular" height={200} className="w-full" />
              <div className="mt-4 space-y-2">
                <Skeleton width="70%" />
                <Skeleton variant="text" lines={2} />
              </div>
            </Card>
          </div>
        </Section>
      </Container>
    </div>
  );
}

/* ---- Helper Components ---- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold text-ktf-obsidian mb-6 pb-3 border-b border-ktf-gray-200">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ColorSwatch({
  name,
  hex,
  className,
  small,
}: {
  name: string;
  hex: string;
  className: string;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`${className} ${small ? "h-12" : "h-20"} rounded-lg`} />
      <div>
        <p className="text-xs font-medium text-ktf-obsidian">{name}</p>
        <p className="text-xs font-mono text-ktf-gray-500">{hex}</p>
      </div>
    </div>
  );
}

function GradientSwatch({
  name,
  className,
}: {
  name: string;
  className: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`${className} h-24 rounded-lg`} />
      <p className="text-sm font-medium text-ktf-obsidian">{name}</p>
    </div>
  );
}

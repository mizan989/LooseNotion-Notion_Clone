"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  FileText,
  Clock,
  Calendar,
  Lock,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";
import { watermelonSpring } from "@/components/ui/motion";
import { LooseNotionLogo } from "@/components/ui/LooseNotionLogo";

export interface LegalSection {
  id: string;
  title: string;
  badge?: string;
  content: React.ReactNode;
}

export interface LegalHighlight {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface LegalPageLayoutProps {
  type: "privacy" | "terms";
  title: string;
  subtitle: string;
  effectiveDate: string;
  readingTime: string;
  highlights: LegalHighlight[];
  sections: LegalSection[];
}

const SOCIAL_LINKS = [
  {
    name: "GitHub",
    href: "https://github.com/mizan989",
    icon: (
      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
      </svg>
    ),
  },
  {
    name: "X",
    href: "https://x.com/mizanmohammadd",
    icon: (
      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/mizann989/",
    icon: (
      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.77c-.93 0-1.68.75-1.68 1.68s.75 1.68 1.68 1.68 1.68-.75 1.68-1.68-.75-1.68-1.68-1.68z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/mizanmohammadd",
    icon: (
      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
];

export function LegalPageLayout({
  type,
  title,
  subtitle,
  effectiveDate,
  readingTime,
  highlights,
  sections,
}: LegalPageLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || "");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id);
        if (section) {
          const top = section.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(sections[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: "smooth" });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#111113] text-[#ececed] flex flex-col selection:bg-white/20 selection:text-white">
      {/* ── Top Sticky Header ───────────────────────────────────────── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...watermelonSpring, delay: 0.05 }}
        className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#111113]/85 backdrop-blur-md"
      >
        <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors group"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 group-hover:border-white/20 group-hover:bg-white/10 transition-all">
                <ArrowLeft className="h-3.5 w-3.5" />
              </div>
              <span className="hidden sm:inline">Home</span>
            </Link>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-6 w-6 items-center justify-center rounded overflow-hidden">
                <LooseNotionLogo className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                LooseNotion
              </span>
            </Link>

          </div>

          {/* Legal Tab Switcher */}
          <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-1 text-xs">
            <Link
              href="/privacy"
              className={`relative px-3 py-1 rounded-full font-medium transition-all ${
                type === "privacy"
                  ? "text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {type === "privacy" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-full bg-white/15 border border-white/15"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                <span>Privacy</span>
              </span>
            </Link>

            <Link
              href="/terms"
              className={`relative px-3 py-1 rounded-full font-medium transition-all ${
                type === "terms"
                  ? "text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {type === "terms" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-full bg-white/15 border border-white/15"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span>Terms</span>
              </span>
            </Link>
          </div>

          {/* Action Links */}
          <div className="flex items-center gap-3">
            <Link
              href="/workspace"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-md transition-all"
            >
              <span>Workspace</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400" />
            </Link>
            <Link
              href="/login"
              className="text-xs font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ── Main Content Area ────────────────────────────────────────── */}
      <main className="flex-1">
        {/* Hero Header */}
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent py-14 sm:py-18">
          {/* Subtle Ambient Background Gradients */}
          <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[320px] w-[600px] rounded-full bg-emerald-500/10 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-20 right-10 h-[250px] w-[350px] rounded-full bg-blue-500/10 blur-[90px]" />

          <div className="container relative mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300 shadow-sm backdrop-blur-sm mb-4">
                {type === "privacy" ? (
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-blue-400" />
                )}
                <span>{type === "privacy" ? "Data Protection & Privacy" : "Legal Terms & Agreement"}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                {title}
              </h1>

              <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed">
                {subtitle}
              </p>

              {/* Metadata Badges */}
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Effective: <strong className="text-zinc-200 font-medium">{effectiveDate}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Reading time: <strong className="text-zinc-200 font-medium">{readingTime}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                  <Lock className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Version: <strong className="text-zinc-200 font-medium">2026.1</strong></span>
                </div>
              </div>
            </motion.div>

            {/* Key Highlights Grid */}
            {highlights && highlights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mt-10 rounded-2xl border border-white/10 bg-[#161619]/90 p-5 sm:p-6 backdrop-blur-sm shadow-xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-zinc-300" />
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                    Executive Summary & Key Takeaways
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {highlights.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-white/15"
                    >
                      <div className="flex items-center gap-2.5 text-white font-medium text-sm mb-1.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white shrink-0">
                          {item.icon}
                        </div>
                        <span className="font-semibold text-zinc-100">{item.title}</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed pl-9.5">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* ── Document Body Layout (Sidebar + Article) ───────────────── */}
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Desktop Sticky Table of Contents */}
            <aside className="hidden lg:block lg:col-span-4">
              <div className="sticky top-24 rounded-2xl border border-white/10 bg-[#161619] p-5 shadow-lg">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Table of Contents
                  </h3>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {sections.length} Sections
                  </span>
                </div>

                <nav className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                  {sections.map((section, idx) => {
                    const isActive = activeSection === section.id;
                    return (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        onClick={(e) => scrollToSection(e, section.id)}
                        className={`group flex items-start gap-2.5 rounded-lg px-3 py-2 text-xs transition-all ${
                          isActive
                            ? "bg-white/15 text-white font-semibold shadow-sm border border-white/15"
                            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                        }`}
                      >
                        <span
                          className={`mt-0.5 font-mono text-[10px] shrink-0 ${
                            isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-400"
                          }`}
                        >
                          {String(idx + 1).padStart(2, "0")}.
                        </span>
                        <span className="line-clamp-2 leading-relaxed">{section.title}</span>
                      </a>
                    );
                  })}
                </nav>

                <div className="mt-6 pt-4 border-t border-white/10 text-xs text-zinc-400">
                  <p className="text-[11px] text-zinc-500 mb-2">Need legal clarifications or data assistance?</p>
                  <a
                    href="mailto:privacy@loosenotion.app"
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white font-medium underline underline-offset-4 transition-colors"
                  >
                    Contact Legal Team <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </aside>

            {/* Main Content Article */}
            <article className="lg:col-span-8 space-y-12">
              {sections.map((section, idx) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#161619]/60 p-6 sm:p-8 transition-colors hover:border-white/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 font-mono text-xs font-bold text-white border border-white/15">
                      {idx + 1}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                      {section.title}
                    </h2>
                    {section.badge && (
                      <span className="hidden sm:inline-block rounded-md bg-white/10 border border-white/15 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                        {section.badge}
                      </span>
                    )}
                  </div>

                  <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
                    {section.content}
                  </div>
                </section>
              ))}

              {/* End of Document Assistance Card */}
              <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Questions about our legal terms?</h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                      We value transparency and user trust above all. If you have questions regarding data handling, your rights, or terms of service, reach out directly.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-medium text-white transition-colors"
                    >
                      <span>Back to Home</span>
                    </Link>
                    <Link
                      href="/workspace"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 px-4 py-2 text-xs font-semibold transition-colors shadow-sm"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-[#0d0d0f] py-8 mt-auto">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/5 text-xs text-zinc-400">
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded overflow-hidden">
                <LooseNotionLogo className="h-6 w-6" />
              </div>
              <span className="font-semibold text-white">LooseNotion</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">Connected workspace for docs & databases</span>
            </div>


            <div className="flex items-center gap-4">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="text-zinc-400 hover:text-white transition-colors p-1.5 -m-1.5 rounded-md hover:bg-white/5"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs text-zinc-500">
            <div>
              © 2026 LooseNotion. Built for focus, speed, and privacy.
            </div>

            <div className="flex items-center gap-6">
              <Link href="/" className="hover:text-zinc-300 transition-colors">
                Home
              </Link>
              <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-zinc-300 transition-colors">
                Terms of Service
              </Link>
              <Link href="/login" className="hover:text-zinc-300 transition-colors">
                Sign in
              </Link>
              <Link href="/workspace" className="hover:text-zinc-300 transition-colors">
                Workspace
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

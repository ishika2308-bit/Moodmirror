import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const APK_DOWNLOAD_URL =
  'https://github.com/ishika2308-bit/Moodmirror/releases/download/moodmirror-v1-gift/MoodMirror-v1.0-release.apk';

const apkMeta = [
  { label: 'Version', value: 'v1.0 Gift Edition' },
  { label: 'Publisher', value: 'Sunshine Pvt. Ltd.' },
  { label: 'Platform', value: 'Android' },
  { label: 'Size', value: '~21 MB' },
  { label: 'Release Date', value: 'June 2026' },
];

export const EarnedCTA: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'center center'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [100, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);

  return (
    <>
      {/* ─── Download CTA Section ─── */}
      <motion.section
        ref={containerRef}
        className="relative w-full min-h-screen flex flex-col items-center justify-center py-32"
        style={{ opacity }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#E6C280]/20 to-transparent pointer-events-none" />

        <motion.div
          style={{ y, scale }}
          className="relative z-10 flex flex-col items-center text-center max-w-2xl px-6"
        >
          {/* Pulsing orb icon */}
          <div className="w-16 h-16 rounded-full bg-black/5 border border-black/10 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(0,0,0,0.05)]">
            <div className="w-4 h-4 rounded-full bg-[#5A4A35] animate-pulse" />
          </div>

          <h2 className="font-serif text-5xl md:text-7xl mb-6 tracking-tight">
            Enter the Mirror
          </h2>
          <p className="font-sans text-xl opacity-60 mb-10">
            Your sanctuary awaits. Completely private, fully local, and thoughtfully designed.
          </p>

          {/* ─── APK Version Card ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm mb-8 surface-glass rounded-2xl px-6 py-5 text-left"
          >
            <div className="flex items-center gap-2 mb-4">
              {/* Android icon */}
              <svg
                className="w-5 h-5 text-[#5A4A35] opacity-70 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.523 15.341a.887.887 0 01-.887-.887.887.887 0 01.887-.887.887.887 0 01.887.887.887.887 0 01-.887.887m-11.046 0a.887.887 0 01-.887-.887.887.887 0 01.887-.887.887.887 0 01.887.887.887.887 0 01-.887.887M17.8 10.5l1.77-3.063a.37.37 0 00-.135-.505.37.37 0 00-.505.135L17.14 10.17A11.067 11.067 0 0012 9.032c-1.823 0-3.538.443-5.14 1.138L5.07 7.067a.37.37 0 00-.505-.135.37.37 0 00-.135.505L6.2 10.5C3.87 11.894 2.25 14.3 2.25 17.09h19.5c0-2.79-1.62-5.196-3.95-6.59" />
              </svg>
              <span className="font-sans text-xs tracking-[0.18em] uppercase opacity-50 font-medium">
                APK Details
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {apkMeta.map(({ label, value }) => (
                <div key={label} className="flex items-baseline justify-between gap-4">
                  <span className="font-sans text-xs tracking-wider uppercase opacity-40 flex-shrink-0">
                    {label}
                  </span>
                  <span className="font-sans text-sm text-[#5A4A35] text-right">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ─── Download Button ─── */}
          <a
            href={APK_DOWNLOAD_URL}
            download
            target="_blank"
            rel="noopener noreferrer"
            id="download-apk-btn"
            className="group relative px-8 py-4 rounded-full bg-[#5A4A35]/10 hover:bg-[#5A4A35]/15 transition-all backdrop-blur-md border border-[#5A4A35]/20 overflow-hidden inline-block"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#5A4A35]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="relative font-sans tracking-widest uppercase text-sm">
              Download for Android
            </span>
          </a>

          <div className="mt-8 flex gap-6 text-xs font-sans uppercase tracking-widest opacity-30">
            <span>iOS (Waitlist)</span>
            <span>•</span>
            <span>Private by Design</span>
          </div>
        </motion.div>
      </motion.section>

      {/* ─── Footer ─── */}
      <footer className="relative w-full py-16 px-6 flex flex-col items-center text-center border-t border-[#5A4A35]/10">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-[#E6C280]/60 to-transparent" />

        {/* Wordmark */}
        <p className="font-serif text-2xl text-[#5A4A35] mb-1 tracking-tight">MoodMirror</p>
        <p className="font-sans text-xs tracking-[0.2em] uppercase opacity-40 mb-10">
          Built by Sunshine Pvt. Ltd.
        </p>

        {/* Disclaimer */}
        <div className="max-w-lg surface-glass rounded-2xl px-8 py-6 mb-10">
          <p className="font-sans text-xs uppercase tracking-[0.15em] opacity-40 mb-3">
            Disclaimer
          </p>
          <p className="font-sans text-sm opacity-60 leading-relaxed">
            MoodMirror is a personal reflection and journaling companion. It is not intended to
            provide medical, psychiatric, or crisis intervention services.
          </p>
        </div>

        {/* Copyright */}
        <p className="font-sans text-xs opacity-30 tracking-wider">
          © Sunshine Pvt. Ltd. All Rights Reserved.
        </p>
      </footer>
    </>
  );
};

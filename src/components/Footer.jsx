import { Link } from 'react-router-dom';
import { Globe, Check } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/[0.06] bg-[#0f1014] pb-24 pt-12 text-[#8f98b2] lg:pb-12">
      <div className="px-4 sm:px-8 lg:pl-[108px] lg:pr-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Company */}
          <div>
            <h3 className="mb-3.5 text-[14px] font-semibold text-white">Company</h3>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <Link to="/help" className="transition hover:text-white">
                  About Priva
                </Link>
              </li>
              <li>
                <Link to="/categories" className="transition hover:text-white">
                  Browse Categories
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: View Website in */}
          <div>
            <h3 className="mb-3.5 text-[14px] font-semibold text-white">View Website in</h3>
            <div className="inline-flex items-center gap-2 text-[13px] font-medium text-[#e1e6f0]">
              <Check size={15} className="text-blue-400" />
              <Globe size={14} className="text-[#8f98b2]" />
              <span>English</span>
            </div>
          </div>

          {/* Column 3: Need Help? */}
          <div>
            <h3 className="mb-3.5 text-[14px] font-semibold text-white">Need Help?</h3>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <Link to="/help" className="transition hover:text-white">
                  Visit Help Center
                </Link>
              </li>
              <li>
                <Link to="/space" className="transition hover:text-white">
                  My Space &amp; Sync
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Brand & Disclaimer */}
          <div>
            <Logo size="sm" />
            <p className="mt-3 text-[12px] leading-relaxed text-[#7c859e]">
              Priva does not host, upload, or store any files. Titles shown here are indexed
              automatically from public metadata and third-party services. The media stays on those
              platforms — we only provide links.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-4 border-t border-white/[0.06] pt-6 text-[12.5px] sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Priva. All Rights Reserved.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/help" className="transition hover:text-white">
              Get help
            </Link>
            <Link to="/legal/terms" className="transition hover:text-white">
              Terms Of Use
            </Link>
            <Link to="/legal/privacy" className="transition hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/legal/dmca" className="transition hover:text-white">
              DMCA
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

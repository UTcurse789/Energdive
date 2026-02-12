"use client";

import { Search, Filter, ChevronRight, Download } from "lucide-react";
import { useState } from "react";

const ReportsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const reports = [
    {
      id: 1,
      title: "The Next Frontier: Advancing HSE to Achieve Global SDGs",
      date: "December 2023",
      category: "HSE",
      desc: "The future of innovation is intrinsically linked to the future of Health, Safety, and Environment (HSE). This report explores the definitive conclusions shaping next-generation sustainability.",
      image:
        "https://via.placeholder.com/600x400/e2e8f0/475569?text=HSE+Report",
    },
    {
      id: 2,
      title:
        "The Next Horizon: Downstream 2030, Innovations for a Low-Carbon Future",
      date: "January 2024",
      category: "Oil & Gas",
      desc: "India's downstream sector is reacting to change; it's leading it by hardwiring sustainability into refineries and petrochemicals for a low-carbon economy.",
      image:
        "https://via.placeholder.com/600x400/e2e8f0/475569?text=Energy+Report",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      
      {/* HEADER */}
      <header className="border-b border-slate-200 pt-10 pb-14 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          
          {/* Modern Breadcrumb */}
          <nav className="flex items-center text-sm text-slate-500 mb-10">
            <a
              href="/"
              className="hover:text-teal-600 transition font-medium"
            >
              Home
            </a>

            <ChevronRight size={14} className="mx-2 text-slate-400" />

            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-700 shadow-sm">
              Reports
            </span>
          </nav>

          {/* Title Section */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
            <div className="md:w-1/2">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Reports
              </h1>
            </div>
            <div className="md:w-1/3 text-slate-600 leading-relaxed text-sm md:text-base">
              Explore our in-depth research insights, policy reviews, and market intelligence shaping the global energy landscape.
            </div>
          </div>
        </div>
      </header>

      {/* FILTER + SEARCH */}
      <section className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Filter */}
          <button className="flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-full text-sm font-medium hover:bg-slate-50 transition">
            <Filter size={16} />
            <span>Filter Options</span>
          </button>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search reports..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={18}
            />
          </div>
        </div>
      </section>

      {/* REPORTS LIST */}
      <main className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 gap-10">
          {reports.map((report) => (
            <div
              key={report.id}
              className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="flex flex-col md:flex-row">

                {/* Image */}
                <div className="relative md:w-80 overflow-hidden">
                  <img
                    src={report.image}
                    alt={report.title}
                    className="w-full h-64 md:h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Category Badge */}
                  <span className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 text-xs font-semibold text-teal-700 rounded-full shadow">
                    {report.category}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 md:p-10 flex flex-col justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                      {report.date}
                    </p>

                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 group-hover:text-teal-600 transition-colors duration-300">
                      {report.title}
                    </h2>

                    <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                      {report.desc}
                    </p>
                  </div>

                  <div className="mt-6">
                    <button className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-white hover:bg-teal-600 px-5 py-2.5 border border-teal-600 rounded-lg transition-all duration-300">
                      View Report
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import * as fitmentApi from "../../api/fitment";
import { unwrapList } from "../../api/client";

const selectClasses =
  "h-11 w-full rounded-md border border-[#E7E2D8] bg-white px-3 text-sm text-[#101B2C] " +
  "focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/20 " +
  "disabled:cursor-not-allowed disabled:bg-[#FAF7F2] disabled:text-[#B8B2A4]";

// Same look as the admin products-page toolbar controls (light + dark).
const toolbarSelectClasses =
  "w-full rounded-md border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#0B1320] px-3 py-2 text-sm " +
  "text-[#1E2430] dark:text-white focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/20 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const labelClasses = "mb-1.5 block text-xs font-medium text-[#7C7669]";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/**
 * Make / model / year vehicle search.
 *
 * variant="card"    – the original boxed form (home + fitment pages)
 * variant="toolbar" – a single inline row, used as the search bar of the results table
 * initial           – optional { make, model, year } slugs/values to pre-select (e.g. from the URL)
 */
export default function FitmentFinder({ compact = false, variant = "card", initial = {} }) {
  const [make, setMake] = useState(initial.make || "");
  const [model, setModel] = useState(initial.model || "");
  const [year, setYear] = useState(initial.year ? String(initial.year) : "");
  const navigate = useNavigate();

  const makesQuery = useQuery({ queryKey: ["makes"], queryFn: fitmentApi.listMakes });
  const modelsQuery = useQuery({
    queryKey: ["models", make],
    queryFn: () => fitmentApi.listModels(make),
    enabled: !!make,
  });
  const yearsQuery = useQuery({
    queryKey: ["years", make, model],
    queryFn: () => fitmentApi.listYears(make, model),
    enabled: !!make && !!model,
  });

  const makes = unwrapList(makesQuery.data);
  const models = unwrapList(modelsQuery.data);
  const years = unwrapList(yearsQuery.data);

  // Reset dependent selects in the handlers (not in effects) so pre-selected
  // values from `initial` survive the first render.
  const handleMake = (value) => { setMake(value); setModel(""); setYear(""); };
  const handleModel = (value) => { setModel(value); setYear(""); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!make || !model || !year) return;
    navigate(`/fitment/results?make=${make}&model=${model}&year=${year}`);
  };

  const isToolbar = variant === "toolbar";
  const selects = isToolbar ? toolbarSelectClasses : selectClasses;

  const makeSelect = (
    <select
      id="ff-make"
      aria-label="Vehicle make"
      value={make}
      onChange={(e) => handleMake(e.target.value)}
      disabled={makesQuery.isLoading}
      className={selects}
    >
      <option value="">Select make</option>
      {makes.map((m) => <option key={m.id} value={m.slug}>{m.name}</option>)}
    </select>
  );
  const modelSelect = (
    <select
      id="ff-model"
      aria-label="Vehicle model"
      value={model}
      onChange={(e) => handleModel(e.target.value)}
      disabled={!make || modelsQuery.isLoading}
      className={selects}
    >
      <option value="">{make ? "Select model" : "Choose a make first"}</option>
      {models.map((m) => <option key={m.id} value={m.slug}>{m.name}</option>)}
    </select>
  );
  const yearSelect = (
    <select
      id="ff-year"
      aria-label="Vehicle year"
      value={year}
      onChange={(e) => setYear(e.target.value)}
      disabled={!model || yearsQuery.isLoading}
      className={selects}
    >
      <option value="">{model ? "Select year" : "Choose a model first"}</option>
      {years.map((y) => <option key={y.id} value={y.year}>{y.year}</option>)}
    </select>
  );

  if (isToolbar) {
    return (
      <form onSubmit={handleSubmit} role="search" className="flex flex-wrap items-center gap-3">
        <div className="min-w-[170px] flex-1 sm:max-w-[220px]">{makeSelect}</div>
        <div className="min-w-[170px] flex-1 sm:max-w-[220px]">{modelSelect}</div>
        <div className="min-w-[140px] flex-1 sm:max-w-[160px]">{yearSelect}</div>
        <button
          type="submit"
          disabled={!make || !model || !year}
          className="inline-flex items-center gap-2 rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-5 py-2 text-sm font-medium text-white dark:text-[#0B1320] transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#D4AF77] disabled:cursor-not-allowed disabled:bg-[#E7E2D8] dark:disabled:bg-[#25344D] disabled:text-[#7C7669] dark:disabled:text-[#9FA8B8]"
        >
          <SearchIcon /> Find parts
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? "" : "rounded-xl border border-[#E7E2D8] bg-white p-6 shadow-[0_1px_2px_rgba(16,27,44,0.04)] md:p-7"}
    >
      {!compact && (
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#101B2C]">Find parts for your vehicle</h2>
          <p className="mt-1 text-sm text-[#7C7669]">
            Select your make, model and year — we'll only show parts confirmed to fit.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
        <div>
          <label htmlFor="ff-make" className={labelClasses}>Make</label>
          {makeSelect}
        </div>
        <div>
          <label htmlFor="ff-model" className={labelClasses}>Model</label>
          {modelSelect}
        </div>
        <div>
          <label htmlFor="ff-year" className={labelClasses}>Year</label>
          {yearSelect}
        </div>
      </div>

      <button
        type="submit"
        disabled={!make || !model || !year}
        className="mt-4 h-11 w-full rounded-md bg-[#BF9A63] text-sm font-medium text-white transition-colors hover:bg-[#A9834E] disabled:cursor-not-allowed disabled:bg-[#E7E2D8] disabled:text-[#B8B2A4] sm:w-auto sm:px-8"
      >
        Find parts
      </button>
    </form>
  );
}
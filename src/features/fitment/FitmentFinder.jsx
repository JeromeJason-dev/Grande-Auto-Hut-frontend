import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import * as fitmentApi from "../../api/fitment";
import { unwrapList } from "../../api/client";

const selectClasses =
  "h-11 w-full rounded-md border border-[#E7E2D8] bg-white px-3 text-sm text-[#101B2C] " +
  "focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/20 " +
  "disabled:cursor-not-allowed disabled:bg-[#FAF7F2] disabled:text-[#B8B2A4]";

const labelClasses = "mb-1.5 block text-xs font-medium text-[#7C7669]";

export default function FitmentFinder({ compact = false }) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
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

  useEffect(() => { setModel(""); setYear(""); }, [make]);
  useEffect(() => { setYear(""); }, [model]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!make || !model || !year) return;
    navigate(`/fitment/results?make=${make}&model=${model}&year=${year}`);
  };

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
          <select
            id="ff-make"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            disabled={makesQuery.isLoading}
            className={selectClasses}
          >
            <option value="">Select make</option>
            {makes.map((m) => (
              <option key={m.id} value={m.slug}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ff-model" className={labelClasses}>Model</label>
          <select
            id="ff-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={!make || modelsQuery.isLoading}
            className={selectClasses}
          >
            <option value="">{make ? "Select model" : "Choose a make first"}</option>
            {models.map((m) => (
              <option key={m.id} value={m.slug}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ff-year" className={labelClasses}>Year</label>
          <select
            id="ff-year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            disabled={!model || yearsQuery.isLoading}
            className={selectClasses}
          >
            <option value="">{model ? "Select year" : "Choose a model first"}</option>
            {years.map((y) => (
              <option key={y.id} value={y.year}>{y.year}</option>
            ))}
          </select>
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
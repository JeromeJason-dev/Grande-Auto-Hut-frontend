import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as fitmentApi from "../../api/fitment";
import { unwrapList } from "../../api/client";

const inputClasses =
  "h-11 w-full rounded-md border border-[#E7E2D8] bg-white px-3 text-sm text-[#101B2C] " +
  "focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

export default function AdminFitmentPage() {
  const queryClient = useQueryClient();

  const [selectedMakeSlug, setSelectedMakeSlug] = useState("");
  const [selectedModelSlug, setSelectedModelSlug] = useState("");

  // Form input states
  const [newMakeName, setNewMakeName] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [newYear, setNewYear] = useState("");

  // Queries
  const makesQuery = useQuery({ queryKey: ["admin-makes"], queryFn: fitmentApi.listMakes });
  const modelsQuery = useQuery({
    queryKey: ["admin-models", selectedMakeSlug],
    queryFn: () => fitmentApi.listModels(selectedMakeSlug),
    enabled: !!selectedMakeSlug,
  });
  const yearsQuery = useQuery({
    queryKey: ["admin-years", selectedMakeSlug, selectedModelSlug],
    queryFn: () => fitmentApi.listYears(selectedMakeSlug, selectedModelSlug),
    enabled: !!selectedMakeSlug && !!selectedModelSlug,
  });

  const makes = unwrapList(makesQuery.data);
  const models = unwrapList(modelsQuery.data);
  const years = unwrapList(yearsQuery.data);

  // Mutations
  const addMakeMutation = useMutation({
    mutationFn: (name) => fitmentApi.createMake({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-makes"] });
      queryClient.invalidateQueries({ queryKey: ["makes"] });
      setNewMakeName("");
    },
  });

  const addModelMutation = useMutation({
    mutationFn: ({ makeSlug, name }) => fitmentApi.createModel(makeSlug, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-models", selectedMakeSlug] });
      setNewModelName("");
    },
  });

  const addYearMutation = useMutation({
    mutationFn: ({ makeSlug, modelSlug, year }) => fitmentApi.createYear(makeSlug, modelSlug, { year }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-years", selectedMakeSlug, selectedModelSlug] });
      setNewYear("");
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[#101B2C] dark:text-white">Vehicle Fitment Catalog</h1>
        <p className="mt-1 text-sm text-[#7C7669] dark:text-[#9FA8B8]">
          Manage the master list of makes, models, and years used for part compatibility checks.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 1. Makes Section */}
        <div className="rounded-xl border border-[#E7E2D8] bg-white p-5 dark:border-slate-800 dark:bg-[#162235]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#7C7669] dark:text-[#9FA8B8]">1. Vehicle Makes</h2>
          
          <form 
            onSubmit={(e) => { 
              e.preventDefault(); 
              if (newMakeName.trim()) addMakeMutation.mutate(newMakeName.trim()); 
            }}
            className="mt-4 flex gap-2"
          >
            <input
              type="text"
              placeholder="e.g. Toyota"
              value={newMakeName}
              onChange={(e) => setNewMakeName(e.target.value)}
              className={inputClasses}
            />
            <button
              type="submit"
              disabled={!newMakeName.trim() || addMakeMutation.isPending}
              className="shrink-0 rounded-md bg-[#BF9A63] px-4 text-sm font-medium text-white hover:bg-[#A9834E] disabled:opacity-50"
            >
              Add
            </button>
          </form>

          <div className="mt-4 max-h-60 overflow-y-auto divide-y divide-[#E7E2D8] dark:divide-slate-700">
            {makes.map((m) => (
              <button
                key={m.id || m.slug}
                onClick={() => { 
                  setSelectedMakeSlug(m.slug); 
                  setSelectedModelSlug(""); 
                }}
                className={`w-full px-3 py-2.5 text-left text-sm transition-colors ${
                  selectedMakeSlug === m.slug 
                    ? "bg-[#BF9A63]/10 font-medium text-[#BF9A63]" 
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-[#101B2C] dark:text-white"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Models Section */}
        <div className="rounded-xl border border-[#E7E2D8] bg-white p-5 dark:border-slate-800 dark:bg-[#162235]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#7C7669] dark:text-[#9FA8B8]">2. Models</h2>

          <form
            onSubmit={(e) => { 
              e.preventDefault(); 
              if (newModelName.trim() && selectedMakeSlug) {
                addModelMutation.mutate({ makeSlug: selectedMakeSlug, name: newModelName.trim() });
              }
            }}
            className="mt-4 flex gap-2"
          >
            <input
              type="text"
              placeholder={selectedMakeSlug ? "e.g. Corolla" : "Select a make first"}
              disabled={!selectedMakeSlug}
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              className={inputClasses}
            />
            <button
              type="submit"
              disabled={!selectedMakeSlug || !newModelName.trim() || addModelMutation.isPending}
              className="shrink-0 rounded-md bg-[#BF9A63] px-4 text-sm font-medium text-white hover:bg-[#A9834E] disabled:opacity-50"
            >
              Add
            </button>
          </form>

          <div className="mt-4 max-h-60 overflow-y-auto divide-y divide-[#E7E2D8] dark:divide-slate-700">
            {!selectedMakeSlug ? (
              <p className="p-3 text-sm text-[#7C7669]">Choose a make on the left to view models.</p>
            ) : models.length === 0 ? (
              <p className="p-3 text-sm text-[#7C7669]">No models found for this make.</p>
            ) : (
              models.map((m) => (
                <button
                  key={m.id || m.slug}
                  onClick={() => setSelectedModelSlug(m.slug)}
                  className={`w-full px-3 py-2.5 text-left text-sm transition-colors ${
                    selectedModelSlug === m.slug 
                      ? "bg-[#BF9A63]/10 font-medium text-[#BF9A63]" 
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 text-[#101B2C] dark:text-white"
                  }`}
                >
                  {m.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* 3. Years Section */}
        <div className="rounded-xl border border-[#E7E2D8] bg-white p-5 dark:border-slate-800 dark:bg-[#162235]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#7C7669] dark:text-[#9FA8B8]">3. Years</h2>

          <form
            onSubmit={(e) => { 
              e.preventDefault(); 
              if (newYear && selectedModelSlug) {
                addYearMutation.mutate({ makeSlug: selectedMakeSlug, modelSlug: selectedModelSlug, year: Number(newYear) });
              }
            }}
            className="mt-4 flex gap-2"
          >
            <input
              type="number"
              placeholder={selectedModelSlug ? "e.g. 2018" : "Select a model first"}
              disabled={!selectedModelSlug}
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              className={inputClasses}
            />
            <button
              type="submit"
              disabled={!selectedModelSlug || !newYear || addYearMutation.isPending}
              className="shrink-0 rounded-md bg-[#BF9A63] px-4 text-sm font-medium text-white hover:bg-[#A9834E] disabled:opacity-50"
            >
              Add
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2 max-h-60 overflow-y-auto pt-1">
            {!selectedModelSlug ? (
              <p className="p-3 text-sm text-[#7C7669]">Choose a model to view or add years.</p>
            ) : years.length === 0 ? (
              <p className="p-3 text-sm text-[#7C7669]">No years added yet for this model.</p>
            ) : (
              years.map((y) => (
                <span
                  key={y.id || y.year}
                  className="inline-flex items-center rounded-md bg-[#FAF7F2] px-3 py-1.5 text-sm font-medium text-[#101B2C] dark:bg-slate-800 dark:text-white"
                >
                  {y.year}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
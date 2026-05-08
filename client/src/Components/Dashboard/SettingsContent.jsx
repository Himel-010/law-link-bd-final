import React from "react";

const SettingsContent = () => {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
        <h3 className="text-xl font-semibold text-slate-900">Account Settings</h3>
        <p className="mt-1 text-sm text-slate-500">Manage profile and preferences</p>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">Full Name</label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400"
              defaultValue="S.M. Asif Arafat"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">Email Address</label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400"
              defaultValue="arafat@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">Company</label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400"
              defaultValue="PrimeDesk Studio"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">Phone</label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400"
              defaultValue="+880 1XXX-XXXXXX"
            />
          </div>
        </div>

        <button className="mt-6 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95">
          Save Changes
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Preferences</h3>
        <p className="mt-1 text-sm text-slate-500">Customize workspace behavior</p>

        <div className="mt-6 space-y-4">
          {[
            "Email notifications",
            "Weekly summary reports",
            "Auto-save drafts",
            "Enable dark preview mode",
          ].map((item, index) => (
            <div
              key={item}
              className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
            >
              <span className="text-sm font-medium text-slate-700">{item}</span>
              <div
                className={`relative h-7 w-12 rounded-full transition ${
                  index < 3 ? "bg-slate-900" : "bg-slate-200"
                }`}
              >
                <div
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    index < 3 ? "left-6" : "left-1"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsContent;
type PageHeaderProps = {
  title: string;
  description: string;
  accent?: string;
};

export const PageHeader = ({ title, description, accent }: PageHeaderProps) => (
  <div className="space-y-2">
    {accent ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">{accent}</p> : null}
    <h2 className="text-3xl font-semibold text-white">{title}</h2>
    <p className="text-base text-slate-300">{description}</p>
  </div>
);

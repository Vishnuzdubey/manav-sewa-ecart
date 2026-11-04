export default function DashboardCard({ title, value, icon: Icon, accent = "primary", hint }) {
  const accentMap = {
    primary: "bg-primary/10 text-primary-dark",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    info: "bg-info/10 text-info",
  };
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{title}</p>
        <p className="text-2xl font-semibold text-foreground mt-2">{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </div>
      {Icon && (
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${accentMap[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

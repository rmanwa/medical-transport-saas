import { cn } from './cn';

export function Card(props: { title?: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white shadow-sm', props.className)}>
      {(props.title || props.right) && (
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          {props.title ? <div className="text-sm font-extrabold text-slate-900">{props.title}</div> : null}
          <div className="ml-auto">{props.right}</div>
        </div>
      )}
      <div className="px-5 py-4">{props.children}</div>
    </div>
  );
}
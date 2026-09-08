interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-center px-8 py-20 text-center">
      <h1 className="mb-4 text-3xl font-bold text-white">{title}</h1>
      <p className="text-gray-400">
        {description ?? 'This screen is tracked in Jira and is not implemented yet.'}
      </p>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-6">Projects</h1>
      <p className="text-lg mb-8">
        Manage your music projects and create new ones.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* This will be replaced with actual project cards */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">Example Project {i}</h2>
            <p className="text-muted-foreground mb-4">Last edited: Yesterday</p>
            <div className="flex justify-end">
              <a
                href={`/daw/studio/${i}`}
                className="text-sm text-primary hover:underline"
              >
                Open in Studio →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

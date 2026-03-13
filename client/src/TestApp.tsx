export default function TestApp() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">CAREN Test App</h1>
        <p className="text-gray-300">Admin Dashboard Works!</p>
        <div className="mt-8">
          <a href="/admin" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold">
            Go to Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
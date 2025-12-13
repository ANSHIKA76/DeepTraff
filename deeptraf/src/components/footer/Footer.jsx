export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 text-center py-4 text-sm mt-8">
      <p className="text-gray-600 dark:text-gray-400">
        © {new Date().getFullYear()} DeepTraaff | Real-Time Traffic Analytics 
      </p>
    </footer>
  );
}

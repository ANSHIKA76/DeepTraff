import { motion } from "framer-motion";

export default function Home() {
  const features = [
    {
      title: "Real-Time Vehicle Detection",
      desc: "Detects vehicles in live traffic videos using deep neural networks with high accuracy.",
    },
    {
      title: "Deep Learning-based Classification",
      desc: "Automatically classifies vehicles such as cars, trucks, and bikes using CNN models.",
    },
    {
      title: "Traffic Density Estimation",
      desc: "Estimates congestion levels by analyzing vehicle count and road occupancy dynamically.",
    },
    {
      title: "Data Visualization Dashboards",
      desc: "Provides interactive charts and heatmaps for analyzing live and historical traffic data.",
    },
    {
      title: "Automatic Report Generation",
      desc: "Generates comprehensive performance and traffic flow reports with real-time updates.",
    },
    {
      title: "Smart Traffic Alerts",
      desc: "Automatically sends alerts for accidents, congestion, and unusual traffic patterns.",
    },
  ];

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 1, when: "beforeChildren", staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, type: "spring", stiffness: 80 },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="px-6 py-16 text-center"
    >
      {/* Animated Title */}
      <motion.h2
        initial={{ opacity: 0, scale: 0.8, y: -40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 1,
          ease: "easeOut",
          type: "spring",
          stiffness: 80,
        }}
        className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent"
      >
        Real-Time Traffic Sensing <br /> and Vehicle Category Analytics using
        Deep Learning
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 1 }}
        className="text-gray-200 mb-12 text-lg"
      >
        Empowering smarter cities with AI-driven traffic monitoring
      </motion.p>

      {/* Features Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3lg:grid-cols-4 gap-8 justify-items-center"
      >
        
        {features.map((feature, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{
              scale: 1.05,
              borderColor: "rgba(0,255,255,0.6)",
              boxShadow: "0 0 20px rgba(0,255,255,0.3)",
              transition: { duration: 0.3 },
            }}
            className="bg-white/10 backdrop-blur-md shadow-md border border-white/20 rounded-2xl p-6 w-72 h-64 flex flex-col justify-center items-center text-center transition-all"
          >
            <h3 className="font-semibold text-lg text-cyan-300 mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-300 text-sm">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

"use client"

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold mb-8 text-center">
          About Team <span className="text-blue-400">NJORD</span>
        </h1>

        {/* ISRO Achievement Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 mb-8 text-white shadow-xl"
        >
          <h2 className="text-2xl font-bold mb-4">🏆 ISRO Space Grand Challenge Achievement</h2>
          <p className="text-lg mb-4">
            Advanced to the Elimination Round, ranking among the top 37 teams nationwide from 1,700+ participants!
          </p>
          <div className="bg-blue-700/50 rounded-lg p-4">
            <p className="italic">
              "Despite a drone malfunction 36 hours before submission, Team NJORD showcased extraordinary determination 
              by rebuilding and testing a new drone overnight."
            </p>
          </div>
        </motion.div>

        {/* Team Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8 rounded-lg overflow-hidden"
        >
          <Image
            src="/Team_Dir_Image.jpeg"
            alt="Team NJORD with Director"
            width={1200}
            height={800}
            className="w-full h-auto rounded-lg shadow-xl"
          />
          <p className="text-center mt-2 text-sm text-gray-400">
            Team NJORD with Prof. Mahadeva Prasanna, Director IIIT Dharwad
          </p>
        </motion.div>

        {/* Team Members */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800 rounded-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Team Members</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Saurav Karki' },
              { name: 'Krishna Sai Gollamudi' },
              { name: 'Amith Mathew' },
              { name: 'Arnav Angarkar' },
              { name: 'Ranjith Babu'},
              { name: 'Gourav Purohit' },
              { name: 'Lohith .B' }
            ].map((member) => (
              <div
                key={member.name}
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
              >
                <h3 className="font-semibold text-blue-300">{member.name}</h3>
                <p className="text-sm text-gray-300">{member.role}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mentorship & Support */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800 rounded-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Mentorship & Support</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl text-blue-300">Technical Mentor</h3>
              <p className="text-gray-300">Mallikarjun Kande - Invaluable mentorship and technical guidance</p>
            </div>
            <div>
              <h3 className="text-xl text-blue-300">Director's Support</h3>
              <p className="text-gray-300">Prof. Mahadeva Prasanna - Unwavering belief and support in fostering innovation</p>
            </div>
            <div>
              <h3 className="text-xl text-blue-300">Industry Support</h3>
              <p className="text-gray-300">Mr. Abhiram - Early sponsorship and component recommendations</p>
            </div>
          </div>
        </motion.div>

        {/* Technical Stack */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-800 rounded-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Technical Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              'MAVLink Protocol',
              'React & Next.js',
              'Python Backend',
              'Real-time Telemetry',
              '3D Visualization',
              'Sensor Integration',
              'WebSocket Communication',
              'Pixhawk Integration',
              'Custom Calibration'
            ].map((tech) => (
              <div
                key={tech}
                className="bg-gray-700 rounded-lg p-3 text-center hover:bg-gray-600 transition-colors"
              >
                {tech}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Vision & Future */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-800 rounded-lg p-6"
        >
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Vision & Future</h2>
          <p className="text-gray-300">
            Team NJORD aims to push the boundaries of drone technology and autonomous systems. Our success
            in the ISRO Space Grand Challenge is just the beginning. We envision developing cutting-edge
            solutions that will revolutionize aerial robotics and their applications across various industries.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
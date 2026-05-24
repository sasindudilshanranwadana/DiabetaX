import { motion } from 'framer-motion'

export function BackgroundBeams() {
  const beams = [
    { id: 1, x: '10%', delay: 0, dur: 8 },
    { id: 2, x: '30%', delay: 2, dur: 10 },
    { id: 3, x: '50%', delay: 4, dur: 7 },
    { id: 4, x: '70%', delay: 1, dur: 9 },
    { id: 5, x: '90%', delay: 3, dur: 11 },
  ]
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {beams.map(b => (
        <motion.div
          key={b.id}
          className="absolute top-0 h-full w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent"
          style={{ left: b.x }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

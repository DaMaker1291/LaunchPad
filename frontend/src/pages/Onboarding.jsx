import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Sparkles, ChevronRight, User, Hash, Star } from 'lucide-react';

const STEPS = [
  {
    id: 'welcome',
    title: 'Connect Your Story',
    subtitle: 'Every great journey starts with a single step. LaunchPad is where ambition meets opportunity.',
    gradient: 'from-cyan-500/20 via-transparent to-pink-500/20',
    icon: Rocket,
  },
  {
    id: 'about',
    title: 'Tell Us About You',
    subtitle: 'Help us personalize your path to success.',
    gradient: 'from-purple-500/20 via-transparent to-cyan-500/20',
    icon: Star,
  },
  {
    id: 'done',
    title: "You're All Set",
    subtitle: 'Your LaunchPad is ready. Time to launch into your future.',
    gradient: 'from-pink-500/20 via-transparent to-purple-500/20',
    icon: Sparkles,
  },
];

const INTERESTS = ['Technology', 'Design', 'Business', 'Science', 'Arts', 'Writing', 'Music', 'Sports', 'Gaming', 'Social Impact'];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState(13);
  const [interests, setInterests] = useState([]);
  const navigate = useNavigate();

  const toggleInterest = (i) => {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const completeOnboarding = () => {
    const profile = { name, age: Number(age), interests };
    localStorage.setItem('onboarding', JSON.stringify(profile));
    localStorage.setItem('lp_onboarding_done', 'true');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col overflow-hidden relative">
      {/* Animated background orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-neon-cyan/5 rounded-full blur-[120px] animate-float pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-neon-pink/5 rounded-full blur-[120px] animate-float pointer-events-none" style={{ animationDelay: '-3s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-neon-purple/5 rounded-full blur-[100px] animate-neon-pulse pointer-events-none" />

      {/* Step indicator */}
      <div className="relative z-10 flex justify-center gap-2 pt-12 pb-4">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === step ? 'w-12 bg-gradient-to-r from-neon-cyan to-neon-pink' :
              i < step ? 'w-3 bg-zinc-500' : 'w-3 bg-zinc-800'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col px-6 max-w-lg mx-auto w-full">
        {step === 0 && (
          <div className="flex-1 flex flex-col justify-center items-center text-center animate-[fade-in-up_0.5s_ease-out]" key="welcome">
            <div className="w-24 h-24 bg-gradient-to-br from-neon-cyan to-neon-pink rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(0,245,212,0.3)] mb-8 animate-float">
              <Rocket className="w-12 h-12 text-black" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neon-cyan via-white to-neon-pink mb-4">
              LaunchPad
            </h1>
            <h2 className="text-2xl font-bold text-white mb-3">Connect Your Story</h2>
            <p className="text-zinc-400 text-center leading-relaxed max-w-sm">
              Every great journey starts with a single step. LaunchPad is where ambition meets opportunity.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="flex-1 flex flex-col justify-center animate-[fade-in-up_0.5s_ease-out]" key="about">
            <h2 className="text-2xl font-bold text-white mb-1">Tell Us About You</h2>
            <p className="text-zinc-400 text-sm mb-8">Help us personalize your path to success.</p>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 block">Your Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-neon-cyan/50 rounded-2xl pl-12 pr-4 py-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-neon-cyan/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 block">Your Age</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="number"
                    min={12}
                    max={100}
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-neon-cyan/50 rounded-2xl pl-12 pr-4 py-4 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-neon-cyan/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300 mb-3 block">Interests (tap to select)</label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((i) => (
                    <button
                      key={i}
                      onClick={() => toggleInterest(i)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                        interests.includes(i)
                          ? 'bg-neon-pink/20 border border-neon-pink/40 text-neon-pink shadow-[0_0_15px_rgba(255,0,122,0.15)]'
                          : 'bg-zinc-950/60 border border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col justify-center items-center text-center animate-[fade-in-up_0.5s_ease-out]" key="done">
            <div className="w-28 h-28 bg-gradient-to-br from-neon-pink to-neon-purple rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(255,0,122,0.3)] mb-8 animate-float" style={{ animationDelay: '-1s' }}>
              <Sparkles className="w-14 h-14 text-black" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">You're All Set</h2>
            <p className="text-zinc-400 leading-relaxed max-w-sm mb-4">
              Your LaunchPad is ready. Time to launch into your future.
            </p>
            {name && (
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl px-6 py-4 backdrop-blur-md">
                <p className="text-sm text-zinc-400">Welcome, <span className="text-neon-cyan font-bold">{name}</span></p>
                {interests.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap justify-center">
                    {interests.slice(0, 3).map(i => (
                      <span key={i} className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-400">{i}</span>
                    ))}
                    {interests.length > 3 && <span className="text-[10px] text-zinc-500">+{interests.length - 3}</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom action area */}
      <div className="relative z-10 px-6 pb-12 max-w-lg mx-auto w-full">
        {step === 0 && (
          <button
            onClick={() => setStep(1)}
            className="w-full bg-gradient-to-r from-neon-cyan to-neon-pink text-black font-bold rounded-2xl px-6 py-4 text-base transition-all duration-300 shadow-[0_0_30px_rgba(0,245,212,0.3)] hover:shadow-[0_0_50px_rgba(0,245,212,0.5)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Get Started
          </button>
        )}

        {step === 1 && (
          <div className="flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium rounded-2xl px-6 py-4 text-sm hover:bg-zinc-800 transition-all"
            >
              Back
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!name}
              className="flex-1 bg-gradient-to-r from-neon-purple to-neon-cyan text-black font-bold rounded-2xl px-6 py-4 text-sm transition-all duration-300 shadow-[0_0_30px_rgba(157,78,221,0.3)] hover:shadow-[0_0_50px_rgba(157,78,221,0.5)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <button
            onClick={completeOnboarding}
            className="w-full bg-gradient-to-r from-neon-pink to-neon-purple text-white font-bold rounded-2xl px-6 py-4 text-base transition-all duration-300 shadow-[0_0_30px_rgba(255,0,122,0.3)] hover:shadow-[0_0_50px_rgba(255,0,122,0.5)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Enter LaunchPad
          </button>
        )}
      </div>
    </div>
  );
}

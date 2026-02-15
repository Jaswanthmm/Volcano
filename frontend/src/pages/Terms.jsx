import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Scale, FileText } from 'lucide-react';

const Terms = () => {
    return (
        <div className="min-h-screen bg-black text-gray-300 font-sans selection:bg-red-900 selection:text-white">

            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur border-b border-white/10">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-white hover:text-red-500 transition-colors">
                        <ArrowLeft size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Return to Base</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                        </span>
                        <span className="text-sm font-bold tracking-tighter text-white">VOLCANO LEGAL</span>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">TERMS OF SERVICE</h1>
                    <p className="text-gray-500 text-sm uppercase tracking-widest border-l-2 border-red-500 pl-4">
                        Effective Date: January 1, 2026
                    </p>
                </div>

                <div className="space-y-12 text-sm leading-relaxed">

                    {/* Section 1 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Shield size={20} className="text-red-500" />
                            1. The Protocol
                        </h2>
                        <p className="mb-4">
                            Volcano ("The Platform") operates as a decentralized marketplace for intellectual property and corporate intelligence.
                            By accessing or using the Platform, you ("The User") agree to be bound by these Terms.
                        </p>
                        <p>
                            The Platform acts solely as a conduit between "Aliens" (Idea Generators) and "Boardrooms" (Corporate Entities).
                            We do not guarantee the purchase of any signal, nor do we guarantee the implementation of any idea.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Scale size={20} className="text-red-500" />
                            2. Intellectual Property & Ownership
                        </h2>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <span className="text-red-500 font-bold">A.</span>
                                    <span>**Submission**: When an Alien submits a signal, they retain ownership until a transaction occurs.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-red-500 font-bold">B.</span>
                                    <span>**Acquisition**: Upon "Acquisition" by a Boardroom, all rights to the idea, strategy, or bug report transfer to the purchasing entity in exchange for the agreed compensation.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-red-500 font-bold">C.</span>
                                    <span>**Abandonment**: Signals rejected by the Volcano Thinking Engine remain the property of the Alien.</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-red-500" />
                            3. User Obligations
                        </h2>
                        <p className="mb-4">
                            **For Aliens**: You warrant that all submissions are your original work and do not infringe on existing patents or NDAs.
                            Spamming the network with high-frequency, low-quality noise will result in permanent Neural Link severance (Ban) and need to face the legal consequences for any unauthorized use of the platform.
                        </p>
                        <p>
                            **For Boardrooms**: You agree to treat all incoming signals as confidential. You may not implement a submitted idea without "Acquiring" it through the platform.
                            Violating this trust will result in immediate expulsion from the Boardroom network and need to face the legal consequences.
                        </p>
                    </section>

                    {/* Disclaimer */}
                    <section className="border-t border-white/10 pt-8 mt-12">
                        <p className="text-xs text-gray-600 uppercase tracking-wider">
                            Disclaimer: Volcano is a facilitator. We are not responsible for disputes arising between Aliens and Boardrooms.
                            Trade at your own risk. The Thinking Engine's assessments are probabilistic, not guaranteed.
                        </p>
                    </section>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-white/10 py-8 text-center">
                <p className="text-xs text-gray-600">&copy; 2026 VOLCANO PROTOCOL. ALL RIGHTS RESERVED.</p>
            </footer>
        </div>
    );
};

export default Terms;

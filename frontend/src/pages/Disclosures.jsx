import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Cpu, Scale, ShieldAlert, Briefcase, Zap, Globe, Lock } from 'lucide-react';

const Disclosures = () => {
    return (
        <div className="min-h-screen bg-black text-gray-300 font-sans selection:bg-red-900 selection:text-white">

            {/* Top Navigation Bar */}
            <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur border-b border-white/10">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-white hover:text-red-500 transition-colors">
                        <ArrowLeft size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest font-mono">Return to Base</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                        </span>
                        <span className="text-sm font-bold tracking-tighter text-white font-mono">VOLCANO DISCLOSURES</span>
                    </div>
                </div>
            </nav>

            {/* Content Container */}
            <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">PLATFORM DISCLOSURES</h1>
                    <p className="text-gray-500 text-xs font-mono uppercase tracking-widest border-l-2 border-red-500 pl-4">
                        Regulatory & Risk Advisory • Effective Protocol Date: January 1, 2026 • Last Updated: October 2026
                    </p>
                </div>

                {/* Important Notice Banner */}
                <div className="bg-red-950/20 border border-red-600/30 rounded-2xl p-6 mb-12 flex items-start gap-4">
                    <AlertTriangle size={24} className="text-red-500 shrink-0 mt-1" />
                    <div>
                        <h3 className="text-white font-mono font-bold text-sm mb-1 uppercase tracking-wider">
                            Critical Operational Notice
                        </h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Volcano operates as an autonomous conduit and corporate intelligence infrastructure. 
                            Users must review these disclosures to understand the scope of artificial intelligence evaluations, 
                            intellectual property implications, and the absence of advisory or fiduciary obligations.
                        </p>
                    </div>
                </div>

                <div className="space-y-12 text-sm leading-relaxed">

                    {/* Section 1: AI & Algorithmic Scoring */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-mono">
                            <Cpu size={20} className="text-red-500" />
                            1. Cognitive Core & Algorithmic Evaluation Disclaimer
                        </h2>
                        <p className="mb-4 text-gray-400">
                            Volcano leverages advanced neural models, automated heuristics, and reasoning engines (the "Cognitive Core" / "Thinking Engine") 
                            to parse submitted signals, estimate feasibility, categorize industry verticals, and simulate boardroom reception.
                        </p>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
                            <div className="flex items-start gap-3">
                                <span className="text-red-500 font-mono text-xs font-bold mt-1">[1.1]</span>
                                <p className="text-gray-300">
                                    <strong className="text-white">Probabilistic Analysis:</strong> AI evaluations, feasibility scores, and technical feedback 
                                    are experimental and probabilistic computational outputs. They do not constitute guaranteed technical verification, 
                                    engineering proofs, or patentability determinations.
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-red-500 font-mono text-xs font-bold mt-1">[1.2]</span>
                                <p className="text-gray-300">
                                    <strong className="text-white">No Financial Valuation:</strong> Projected valuations, financial impact metrics, 
                                    or market sizing generated by the Cognitive Core are algorithmic simulations for comparative ranking and do not represent formal financial appraisals or investment guarantees.
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-red-500 font-mono text-xs font-bold mt-1">[1.3]</span>
                                <p className="text-gray-300">
                                    <strong className="text-white">Model Hallucinations & Limits:</strong> While guarded against false outputs, machine intelligence 
                                    may occasionally misinterpret technical contexts. Users are solely responsible for independent validation.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Non-Broker / Non-Advisory */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-mono">
                            <Scale size={20} className="text-red-500" />
                            2. Regulatory & Non-Broker / Non-Advisory Status
                        </h2>
                        <p className="mb-4 text-gray-400">
                            Volcano Protocol is a software infrastructure provider and communication platform. 
                            Under no circumstances should the Platform or its operations be construed as:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2 mb-4">
                            <li><strong className="text-white">Not a Registered Broker-Dealer:</strong> We do not effect transactions in securities, underwrite capital raises, or operate an exchange or alternative trading system (ATS).</li>
                            <li><strong className="text-white">Not an Investment Advisor:</strong> We do not provide investment advice, venture capital recommendations, or financial counsel.</li>
                            <li><strong className="text-white">Not a Legal Practice or Patent Agency:</strong> We do not provide legal advice, patent prosecution services, or represent parties in intellectual property disputes.</li>
                        </ul>
                        <p className="text-gray-400">
                            Any discussions, contracts, or agreements negotiated between Alien operatives and Boardroom members are private arrangements entered into at their own discretion and legal risk.
                        </p>
                    </section>

                    {/* Section 3: Intellectual Property & Prior Art Risk */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-mono">
                            <ShieldAlert size={20} className="text-red-500" />
                            3. Intellectual Property, Prior Art & Public Disclosure Risks
                        </h2>
                        <p className="mb-4 text-gray-400">
                            Transmitting innovation concepts to third parties involves inherent intellectual property considerations:
                        </p>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
                            <p className="text-gray-300">
                                <strong className="text-white">Independent Development:</strong> Large enterprise Boardrooms frequently maintain extensive internal R&D portfolios. 
                                Volcano does not guarantee that a target corporation has not already conceived, researched, or patented a concept similar or identical to your submitted signal.
                            </p>
                            <p className="text-gray-300">
                                <strong className="text-white">Patent Rights & Public Disclosure:</strong> Submitting ideas without prior patent filing may impact patentability in certain jurisdictions (loss of absolute novelty). 
                                Innovators are strongly advised to consult qualified patent counsel before disclosing unpatented inventions.
                            </p>
                            <p className="text-gray-300">
                                <strong className="text-white">No Endorsement of Ownership:</strong> Volcano does not verify whether an Alien operative holds valid copyright, patent, or proprietary rights to submitted materials, though operatives warrant non-infringement under our Terms.
                            </p>
                        </div>
                    </section>

                    {/* Section 4: No Guarantee of Purchase or Transaction */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-mono">
                            <Briefcase size={20} className="text-red-500" />
                            4. No Commercial Guarantee or Transaction Assurance
                        </h2>
                        <p className="mb-4 text-gray-400">
                            Volcano provides an encrypted, intelligent conduit for ideas to reach corporate decision-makers. However:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
                            <li>Volcano does not guarantee that any Boardroom will review, evaluate, respond to, or acquire any signal.</li>
                            <li>Volcano does not guarantee any minimum payout, grant, royalty, or commercial monetization.</li>
                            <li>Boardroom entities retain complete autonomy over whether to initiate communications, schedule discovery, or reject signals.</li>
                        </ul>
                    </section>

                    {/* Section 5: Independent Operative Relationships */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-mono">
                            <Zap size={20} className="text-red-500" />
                            5. Independent Operatives & Third-Party Actions
                        </h2>
                        <p className="mb-4 text-gray-400">
                            Users of Volcano (both Aliens and Boardrooms) act solely as independent individuals or entities. 
                            Nothing contained within the Platform, communications, or workflows creates an employment, agency, franchise, joint venture, or partnership relationship with Volcano Protocol.
                        </p>
                        <p className="text-gray-400">
                            Volcano is not responsible for the acts, omissions, default, or bad-faith actions of any user, operative, or corporate representative on the network.
                        </p>
                    </section>

                    {/* Section 6: Security & Transmission Limits */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-mono">
                            <Lock size={20} className="text-red-500" />
                            6. Cybersecurity & Transmission Protocols
                        </h2>
                        <p className="mb-4 text-gray-400">
                            While Volcano enforces TLS encryption, tokenized sessions, and secure cloud storage, no electronic transmission over the internet can be guaranteed as 100% impenetrable. 
                            Users are responsible for safeguarding their authentication credentials and avoiding transmitting export-controlled defense data, classified national security information, or illegal content.
                        </p>
                    </section>

                    {/* Section 7: Governance Contact */}
                    <section className="border-t border-white/10 pt-8 mt-12">
                        <div className="flex items-center gap-2 text-white font-mono text-base font-bold mb-2">
                            <Globe size={18} className="text-red-500" />
                            Compliance & Legal Inquiries
                        </div>
                        <p className="text-gray-500 text-xs leading-relaxed">
                            Questions regarding these platform disclosures, regulatory filings, or intellectual property questions should be routed to our compliance office at <a href="mailto:disclosures@volcano.io" className="text-red-400 underline hover:text-white transition-colors">disclosures@volcano.io</a>.
                        </p>
                    </section>

                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-white/10 py-8 text-center text-xs font-mono text-gray-600">
                <p>&copy; 2026 VOLCANO PROTOCOL. ALL RIGHTS RESERVED.</p>
            </footer>

        </div>
    );
};

export default Disclosures;

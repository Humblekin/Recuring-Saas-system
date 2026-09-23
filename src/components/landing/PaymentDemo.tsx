"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

// =============================================================================
// PAYMENT DEMO — Interactive Multi-State Experience
// =============================================================================

type PaymentState = "amount" | "frequency" | "auth" | "processing" | "success" | "receipt";

const AMOUNTS = [50, 100, 250, 500, 1000];

export default function PaymentDemo() {
  const [step, setStep] = useState<PaymentState>("amount");
  const [amount, setAmount] = useState<number>(100);
  const [isRecurring, setIsRecurring] = useState<boolean>(true);
  const [email, setEmail] = useState("");

  // Simulate payment flow
  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("processing");
    setTimeout(() => setStep("success"), 1500);
    setTimeout(() => setStep("receipt"), 3000);
  };

  const handleReset = () => {
    setStep("amount");
    setAmount(100);
    setIsRecurring(true);
    setEmail("");
  };

  return (
    <section className="py-24 bg-cream overflow-hidden border-t border-border">
      <div className="section-container">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="section-label mb-4 block">Interactive Demo</span>
          <h2 className="mb-4">Experience the payment flow.</h2>
          <p className="text-body-lg">
            This is exactly what your supporters see when they click your link or scan your QR code.
            Simple, secure, and beautiful.
          </p>
        </div>

        <div className="max-w-md mx-auto relative perspective-1000">
          
          {/* Background Decorative Elements */}
          <div className="absolute -inset-10 bg-gradient-to-tr from-terracotta/5 to-ink/5 rounded-[3rem] blur-xl -z-10"></div>
          
          <div className="bg-surface rounded-3xl shadow-product border border-border overflow-hidden">
            
            {/* Demo Header */}
            <div className="bg-cream/50 border-b border-border p-6 text-center">
              <div className="w-12 h-12 bg-cream rounded-full border border-border flex items-center justify-center mx-auto mb-3 text-terracotta font-display text-xl shadow-sm">
                HW
              </div>
              <h3 className="text-lg font-medium">HopeWorks Ghana</h3>
              <p className="text-xs text-ink-muted uppercase tracking-widest font-mono mt-1">Community Fund</p>
            </div>

            <div className="p-6 relative min-h-[400px]">
              <AnimatePresence mode="wait">
                
                {/* STATE 1: AMOUNT SELECTION */}
                {step === "amount" && (
                  <motion.div
                    key="amount"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col h-full"
                  >
                    <h4 className="text-sm font-medium mb-4 text-center">Select an amount</h4>
                    
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {AMOUNTS.map((val) => (
                        <button
                          key={val}
                          onClick={() => setAmount(val)}
                          className={`py-3 rounded-xl font-mono transition-all ${
                            amount === val 
                              ? "bg-ink text-surface shadow-md scale-[1.02]" 
                              : "bg-cream border border-border text-ink hover:bg-border/50"
                          }`}
                        >
                          {formatCurrency(val)}
                        </button>
                      ))}
                      <button
                        className="py-3 rounded-xl font-mono bg-cream border border-border text-ink-muted hover:bg-border/50 transition-all"
                      >
                        Other
                      </button>
                    </div>

                    <div className="mt-auto pt-6">
                      <button 
                        onClick={() => setStep("frequency")}
                        className="w-full btn-primary py-3.5 text-base"
                      >
                        Continue
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STATE 2: FREQUENCY SELECTION */}
                {step === "frequency" && (
                  <motion.div
                    key="frequency"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col h-full"
                  >
                    <div className="text-center mb-8">
                      <div className="text-sm text-ink-muted mb-1">You are contributing</div>
                      <div className="text-3xl font-mono font-medium">{formatCurrency(amount)}</div>
                    </div>

                    <h4 className="text-sm font-medium mb-4 text-center">How often?</h4>
                    
                    <div className="flex flex-col gap-3 mb-6">
                      <button
                        onClick={() => setIsRecurring(false)}
                        className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                          !isRecurring 
                            ? "border-ink bg-cream shadow-sm" 
                            : "border-border hover:border-ink-muted"
                        }`}
                      >
                        <div>
                          <div className="font-medium">One-time payment</div>
                          <div className="text-xs text-ink-muted mt-1">Charged once today</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${!isRecurring ? 'border-terracotta' : 'border-border'}`}>
                          {!isRecurring && <div className="w-2.5 h-2.5 bg-terracotta rounded-full"></div>}
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setIsRecurring(true)}
                        className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isRecurring 
                            ? "border-ink bg-cream shadow-sm" 
                            : "border-border hover:border-ink-muted"
                        }`}
                      >
                        <div>
                          <div className="font-medium">Monthly contribution</div>
                          <div className="text-xs text-ink-muted mt-1">Charged automatically every month</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isRecurring ? 'border-terracotta' : 'border-border'}`}>
                          {isRecurring && <div className="w-2.5 h-2.5 bg-terracotta rounded-full"></div>}
                        </div>
                      </button>
                    </div>

                    <div className="mt-auto pt-6 flex gap-3">
                      <button 
                        onClick={() => setStep("amount")}
                        className="btn-secondary px-4"
                      >
                        ←
                      </button>
                      <button 
                        onClick={() => setStep("auth")}
                        className="flex-1 btn-primary py-3.5 text-base"
                      >
                        Continue
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STATE 3: AUTHORIZATION */}
                {step === "auth" && (
                  <motion.div
                    key="auth"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col h-full"
                  >
                    <div className="mb-6 p-4 bg-cream rounded-xl border border-border flex justify-between items-center">
                      <div>
                        <div className="text-xs text-ink-muted uppercase tracking-widest font-mono">Total</div>
                        <div className="font-mono font-medium mt-1">
                          {formatCurrency(amount)} {isRecurring ? "/ month" : ""}
                        </div>
                      </div>
                      <button onClick={() => setStep("amount")} className="text-xs text-terracotta underline">Edit</button>
                    </div>

                    <form onSubmit={handleAuthorize} className="flex flex-col flex-1">
                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="block text-xs font-medium mb-1.5">Email address</label>
                          <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full p-3 rounded-lg border border-border bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5">MTN MoMo phone number</label>
                          <input 
                            type="tel" 
                            required
                            placeholder="024 123 4567"
                            className="w-full p-3 rounded-lg border border-border bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all"
                          />
                        </div>
                        {isRecurring && (
                          <label className="flex items-start gap-2 text-xs text-ink-muted leading-relaxed">
                            <input type="checkbox" defaultChecked className="mt-0.5 accent-[#ffcb05]" />
                            <span>I authorize HopeWorks Ghana to charge my MTN MoMo wallet every month. I can cancel anytime.</span>
                          </label>
                        )}
                      </div>

                      <div className="mt-auto">
                        <button type="submit" className="w-full btn-primary py-3.5 text-base">
                          Send payment request
                        </button>
                        <p className="text-[10px] text-center text-ink-muted mt-4">
                          Powered by MTN Mobile Money. Payments made in GHS.
                        </p>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* STATE 4: PROCESSING */}
                {step === "processing" && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-surface z-10"
                  >
                    <div className="w-12 h-12 border-4 border-cream border-t-terracotta rounded-full animate-spin mb-6"></div>
                    <p className="font-medium animate-pulse text-ink">Processing securely...</p>
                  </motion.div>
                )}

                {/* STATE 5: SUCCESS */}
                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-surface z-10"
                  >
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-6">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium text-ink">Payment Successful</h3>
                  </motion.div>
                )}

                {/* STATE 6: RECEIPT */}
                {step === "receipt" && (
                  <motion.div
                    key="receipt"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col h-full items-center justify-center pt-4"
                  >
                    <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center mb-4 text-terracotta border border-border">
                      HW
                    </div>
                    <h3 className="text-xl mb-1">Thank you!</h3>
                    <p className="text-sm text-ink-muted mb-8 text-center">Your contribution has been received by HopeWorks Ghana.</p>
                    
                    <div className="w-full bg-cream rounded-xl p-5 border border-border mb-8">
                      <div className="flex justify-between items-center mb-3 text-sm">
                        <span className="text-ink-muted">Amount</span>
                        <span className="font-mono font-medium">{formatCurrency(amount)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3 text-sm">
                        <span className="text-ink-muted">Type</span>
                        <span>{isRecurring ? "Monthly Subscription" : "One-time"}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-border border-dashed text-sm">
                        <span className="text-ink-muted">Receipt</span>
                        <span className="font-mono text-xs">#TRX-98274A</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleReset}
                      className="btn-secondary w-full"
                    >
                      Restart Demo
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

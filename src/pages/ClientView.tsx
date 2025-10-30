import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, addWeeks, startOfMonth, endOfMonth, parseISO } from "date-fns";

type Payment = {
  date: string;
  amount: number;
  status: "paid" | "due" | "nothing";
};

const ClientView = () => {
  const startDate = new Date(2025, 9, 31); // October 31, 2025
  const paymentAmount = 300;

  const generatePayments = (): Payment[] => {
    const payments: Payment[] = [];
    let currentDate = startDate;
    const endDate = new Date(2028, 11, 31); // December 31, 2028

    while (currentDate <= endDate) {
      payments.push({
        date: format(currentDate, "yyyy-MM-dd"),
        amount: paymentAmount,
        status: "nothing",
      });
      currentDate = addWeeks(currentDate, 2);
    }
    return payments;
  };

  // Load payments from localStorage
  const loadPayments = (): Payment[] => {
    const stored = localStorage.getItem("payment-statuses");
    if (stored) {
      try {
        const statuses: Record<string, string> = JSON.parse(stored);
        const generated = generatePayments();
        // Merge stored statuses with generated payments
        return generated.map(p => {
          const storedStatus = statuses[p.date];
          return {
            ...p,
            status: (storedStatus === "paid" || storedStatus === "due" || storedStatus === "nothing") ? storedStatus : p.status
          };
        });
      } catch (e) {
        return generatePayments();
      }
    }
    return generatePayments();
  };

  const [payments, setPayments] = useState<Payment[]>(loadPayments());

  // Reload payments when the page becomes visible (when user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setPayments(loadPayments());
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const monthlyPayments = payments.filter(p => {
    const paymentDate = parseISO(p.date);
    return paymentDate >= monthStart && paymentDate <= monthEnd;
  });

  const monthlyReceived = monthlyPayments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = payments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalDue = payments
    .filter(p => p.status === "due")
    .reduce((sum, p) => sum + p.amount, 0);

  const monthlyDue = monthlyPayments
    .filter(p => p.status === "due")
    .reduce((sum, p) => sum + p.amount, 0);

  const nextPayment = payments.find(p => (p.status === "due" || p.status === "nothing") && parseISO(p.date) > new Date());

  return (
    <div className="min-h-screen bg-black p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3 mb-1">
              <CalendarIcon className="h-8 w-8 text-cyan-400" />
              Payment Status
            </h1>
            <p className="text-gray-400 text-sm">View your payment schedule and status</p>
          </div>
          {/* Total Due in top right corner */}
          <div className="absolute top-0 right-0">
            <Card className="p-3 text-center bg-gray-900/30 backdrop-blur-sm border border-red-600/40 rounded-xl hover:border-red-500/60 transition-all duration-200">
              <p className="text-xs text-red-400 mb-1 font-medium">Total Due</p>
              <p className={`text-xl font-bold ${totalDue > 0 ? 'text-red-300' : 'text-red-500'}`}>${totalDue}</p>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 mb-6">
          <Button
            variant="outline"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:text-white transition-all duration-200"
          >
            Previous
          </Button>
          <p className="text-lg font-bold text-white px-6">{format(currentMonth, "MMMM yyyy")}</p>
          <Button
            variant="outline"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:text-white transition-all duration-200"
          >
            Next
          </Button>
        </div>

        {/* Payment Schedule - Moved to Top */}
        <Card className="p-4 bg-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-cyan-400" />
            Payment Schedule
          </h2>

          {monthlyPayments.length === 0 ? (
            <p className="text-center text-gray-400 py-6">No payments scheduled for this month</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Payment items */}
              {monthlyPayments.map((payment) => (
                <div
                  key={payment.date}
                  className="flex items-center p-3 rounded-lg bg-gray-800/30 backdrop-blur-sm hover:bg-gray-700/40 transition-all duration-200 border border-gray-600/50 hover:border-cyan-500/50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-center min-w-[50px]">
                      <p className="text-2xl font-bold text-white">
                        {format(parseISO(payment.date), "dd")}
                      </p>
                      <p className="text-xs text-gray-400 font-medium">
                        {format(parseISO(payment.date), "MMM")}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-200 text-xs">
                        {format(parseISO(payment.date), "EEEE, MMM d, yyyy")}
                      </p>
                      <p className="text-gray-400 text-sm font-semibold">${payment.amount}</p>
                      <p className={`text-xs font-medium mt-1 ${
                        payment.status === "paid" ? "text-emerald-400" :
                        payment.status === "due" ? "text-red-400" : "text-amber-400"
                      }`}>
                        {payment.status === "paid" ? "✓ Paid" : payment.status === "due" ? "⚠ Due" : "⏳ Pending"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5 text-center bg-gray-900/30 backdrop-blur-sm border border-green-600/40 rounded-xl hover:border-green-500/60 transition-all duration-200">
            <p className="text-xs text-green-400 mb-2 font-medium">This Month Sent</p>
            <p className="text-3xl font-bold text-green-300">${monthlyReceived}</p>
          </Card>
          <Card className="p-5 text-center bg-gray-900/30 backdrop-blur-sm border border-orange-500/30 rounded-xl hover:border-orange-400/50 transition-all duration-200">
            <p className="text-xs text-orange-300 mb-2 font-medium">This Month Due</p>
            <p className={`text-3xl font-bold ${monthlyDue > 0 ? 'text-orange-200' : 'text-orange-400'}`}>${monthlyDue}</p>
          </Card>
        </div>

        {/* Next Payment */}
        {nextPayment && (
          <Card className="p-5 bg-gray-900/30 backdrop-blur-sm border border-purple-500/30 rounded-xl">
            <h2 className="text-lg font-semibold text-purple-200 mb-4">Next Payment</h2>
            <div className="text-center">
              <p className="text-4xl font-bold text-purple-100 mb-2">
                {format(parseISO(nextPayment.date), "MMM dd")}
              </p>
              <p className="text-xl text-purple-300 mb-2 font-semibold">${nextPayment.amount}</p>
              <p className="text-sm text-purple-400">
                {format(parseISO(nextPayment.date), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          </Card>
        )}

        {/* Footer Info */}
        <Card className="p-4 bg-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-xl">
          <div className="text-center space-y-1">
            <p className="text-xs text-gray-400">Payment Cycle: Every 2 weeks</p>
            <p className="text-xs text-gray-400">Payment Amount: $300</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ClientView;
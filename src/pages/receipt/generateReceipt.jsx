import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AdminLayout from "../../components/layout/adminLayout";
import api from "../../api/axios";
import { toast } from "react-toastify";

const GenerateReceipt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    receiptNumber: "",
    receiptDate: "",
    name: "",
    course: "",
    year: "",
    // paymentMode: "cash",
    // referenceNumber: "",
  });

  useEffect(() => {
    if (id) {
      fetchReceiptById();
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      generateReceiptNumber();
    }
  }, []);

  const fetchReceiptById = async () => {
    try {
      const res = await api.get(`/admin/get-receipt/${id}`);

      const data = res.data.receipt;

      // setForm({
      //   receiptNumber: data.receiptNumber || "",
      //   receiptDate: data.receiptDate?.split("T")[0],
      //   name: data.name || "",
      //   course: data.course || "",
      //   year: data.year || "",
      //   paymentMode: data.paymentMode || "cash",
      //   referenceNumber: data.referenceNumber || "",
      // });
      setForm({
        receiptNumber: data.receiptNumber || "",
        receiptDate: data.receiptDate?.split("T")[0],
        name: data.name || "",
        course: data.course || "",
        year: data.year || "",
      });

      // setParticulars(data.particulars || [{ title: "", amount: "" }]);
      // setParticulars(
      //   data.particulars?.length
      //     ? data.particulars.map((item) => ({
      //         title: item.title || "",
      //         amount: item.amount || "",
      //         paymentMode: item.paymentMode || "cash",
      //         referenceNumber: item.referenceNumber || "",
      //       }))
      //     : [
      //         {
      //           title: "",
      //           amount: "",
      //           paymentMode: "cash",
      //           referenceNumber: "",
      //         },
      //       ],
      // );
      setParticulars(
        data.particulars?.length
          ? data.particulars.map((item) => ({
              title: item.title || "",
              amount: item.amount || "",
            }))
          : [
              {
                title: "",
                amount: "",
              },
            ],
      );
      setPaymentBreakup(
        data.paymentBreakup?.length
          ? data.paymentBreakup
          : data.paymentMode
            ? [
                {
                  paymentMode: data.paymentMode,
                  amount: data.totalAmount,
                  referenceNumber: data.referenceNumber || "",
                },
              ]
            : [
                {
                  paymentMode: "cash",
                  amount: "",
                  referenceNumber: "",
                },
              ],
      );
    } catch (err) {
      toast.error("Error fetching receipt");
    }
  };

  // 🔥 Calculate total

  const [particulars, setParticulars] = useState([
    {
      title: "",
      amount: "",
      // paymentMode: "cash",
      // referenceNumber: "",
    },
  ]);
  const [paymentBreakup, setPaymentBreakup] = useState([
    {
      paymentMode: "cash",
      amount: "",
      referenceNumber: "",
    },
  ]);
  const totalAmount = particulars.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  const paymentTotal = paymentBreakup.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  const balanceAmount = totalAmount - paymentTotal;

  // 🔥 Handle input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔥 Handle particulars
  // const handleParticularChange = (index, field, value) => {
  //   const updated = [...particulars];
  //   updated[index][field] = value;
  //   setParticulars(updated);
  // };

  const handleParticularChange = (index, field, value) => {
    const updated = [...particulars];

    // 🔥 CHECK DUPLICATE ONLY FOR TITLE
    if (field === "title") {
      const isDuplicate = updated.some(
        (item, i) => item.title === value && i !== index,
      );

      if (isDuplicate) {
        toast.error("This particular is already selected");
        return; // 🚫 STOP UPDATE
      }
    }

    updated[index][field] = value;
    setParticulars(updated);
  };

  const addParticular = () => {
    setParticulars([
      ...particulars,
      {
        title: "",
        amount: "",
        // paymentMode: "cash",
        // referenceNumber: "",
      },
    ]);
  };

  const removeParticular = (index) => {
    const updated = particulars.filter((_, i) => i !== index);
    setParticulars(updated);
  };

  const resetForm = () => {
    setForm({
      receiptNumber: "",
      receiptDate: "",
      name: "",
      course: "",
      year: "",
    });

    setParticulars([
      {
        title: "",
        amount: "",
        // paymentMode: "cash",
        // referenceNumber: "",
      },
    ]);
    setPaymentBreakup([
      {
        paymentMode: "cash",
        amount: "",
        referenceNumber: "",
      },
    ]);
  };

  // 🔥 Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validParticulars = particulars.filter(
      (item) => item.title && item.amount,
    );

    const validPaymentBreakup = paymentBreakup.filter(
      (item) => item.paymentMode && Number(item.amount) > 0,
    );

    if (validPaymentBreakup.length === 0) {
      toast.error("Please add payment details");
      return;
    }

    if (validParticulars.length === 0) {
      toast.error("Please add at least one valid particular");
      return;
    }

    if (
      validPaymentBreakup.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      ) !== totalAmount
    ) {
      toast.error("Payment split total must equal receipt amount");
      return;
    }

    try {
      setLoading(true);
      if (id) {
        await api.put(`/admin/edit-receipt/${id}`, {
          ...form,
          particulars: validParticulars,
          paymentBreakup: validPaymentBreakup,
        });

        toast.success("Receipt Updated");
      } else {
        await api.post("/admin/generate-receipt", {
          ...form,
          particulars: validParticulars,
          paymentBreakup: validPaymentBreakup,
        });

        toast.success("Receipt Generated");
      }

      // 🔥 RESET FORM
      resetForm();

      // 🔥 NAVIGATE
      setTimeout(() => {
        navigate("/admin/view-receipts");
      }, 800);
    } catch (err) {
      console.log("error", err);

      const message = err.response?.data?.message || "Error saving receipt";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const generateReceiptNumber = async () => {
    try {
      const res = await api.get("/admin/fetch-all-receipts?page=1");

      const lastReceipt = res.data.data[0];

      let nextNumber = 1;

      if (lastReceipt?.receiptNumber) {
        const lastNum = parseInt(
          lastReceipt.receiptNumber.replace("SLCMS", ""),
        );

        if (!isNaN(lastNum)) {
          nextNumber = lastNum + 1;
        }
      }

      const newNumber = `SLCMS${String(nextNumber).padStart(4, "0")}`;

      setForm((prev) => ({
        ...prev,
        receiptNumber: newNumber,
      }));
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <AdminLayout>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl px-8 py-6 shadow-2xl flex flex-col items-center gap-4">
            <div className="h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>

            <p className="font-semibold text-gray-700">
              {id ? "Updating Receipt..." : "Generating Receipt..."}
            </p>

            <p className="text-sm text-gray-500">
              Please wait while we save the receipt and sync Google Sheet
            </p>
          </div>
        </div>
      )}
      <div className="p-8 max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100">
        {/* HEADER */}
        <h1 className="text-2xl font-bold text-green-800 mb-1">
          {id ? "Edit Receipt" : "Generate Receipt"}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {id
            ? "Update receipt details and payment information"
            : "Enter receipt details and payment information"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BASIC INFO */}
          <div className="grid grid-cols-2 gap-4">
            <input
              name="receiptNumber"
              placeholder="Receipt Number"
              value={form.receiptNumber}
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              onChange={handleChange}
              required
            />

            <input
              type="date"
              name="receiptDate"
              value={form.receiptDate}
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              onChange={handleChange}
              required
            />

            <input
              name="name"
              placeholder="Student Name"
              value={form.name}
              className="border border-gray-300 p-3 rounded-lg col-span-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
              onChange={handleChange}
              required
            />

            {/* <input
              name="course"
              placeholder="Course (e.g. BCA)"
              value={form.course}
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500"
              onChange={handleChange}
            /> */}
            <select
              name="course"
              value={form.course}
              onChange={handleChange}
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Course</option>
              <option>B.Com</option>
              <option>BBA</option>
              <option>BCA</option>
              <option>B.Sc</option>
              <option>BA</option>
              <option>M.Com</option>
              <option>MCA</option>
              <option>MBA</option>
              <option>IAS/KAS</option>
            </select>

            <input
              name="year"
              placeholder="Year (e.g. 1st Year / 2024)"
              value={form.year}
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500"
              onChange={handleChange}
            />
          </div>

          {/* PARTICULARS */}
          <div>
            <h2 className="text-md font-semibold text-gray-700 mb-3 border-b pb-1">
              Particulars
            </h2>

            {particulars.map((item, index) => (
              <div key={index} className="flex gap-2 mb-3 items-center">
                <select
                  value={item.title}
                  onChange={(e) =>
                    handleParticularChange(index, "title", e.target.value)
                  }
                  className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Particular</option>

                  {[
                    "Tuition Fees",
                    "Hostel Fees",
                    "Miscellaneous Expenses",
                    "Others",
                    "IAS/KAS Academy",
                  ].map((option) => (
                    <option
                      key={option}
                      value={option}
                      disabled={particulars.some(
                        (p, i) => p.title === option && i !== index,
                      )}
                    >
                      {option}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Amount"
                  value={item.amount}
                  className="border border-gray-300 p-3 rounded-lg w-40 focus:ring-2 focus:ring-green-500"
                  onChange={(e) =>
                    handleParticularChange(index, "amount", e.target.value)
                  }
                />

                <button
                  type="button"
                  onClick={() => removeParticular(index)}
                  className="text-red-500 font-bold text-lg hover:scale-110 transition"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addParticular}
              className="text-green-700 font-medium text-sm hover:underline"
            >
              + Add Particular
            </button>
          </div>

          {/* 🔥 PREMIUM TOTAL */}
          <div className="bg-gradient-to-r from-green-100 to-green-50 border border-green-200 rounded-xl p-5 flex justify-between items-center shadow-sm">
            <span className="text-gray-700 font-medium text-lg">
              Total Payable
            </span>
            <span className="text-3xl font-bold text-green-800 tracking-wide">
              ₹ {totalAmount.toLocaleString()}
            </span>
          </div>

          <div className="mt-6">
            <h2 className="text-md font-semibold text-gray-700 mb-3 border-b pb-1">
              Payment Split
            </h2>

            {paymentBreakup.map((item, index) => (
              <div key={index} className="flex gap-2 mb-3 items-center">
                <select
                  value={item.paymentMode}
                  onChange={(e) => {
                    const updated = [...paymentBreakup];
                    updated[index].paymentMode = e.target.value;
                    setPaymentBreakup(updated);
                  }}
                  className="border p-3 rounded-lg w-40"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                  <option value="dd">DD</option>
                </select>

                <input
                  type="number"
                  placeholder="Amount"
                  value={item.amount}
                  onChange={(e) => {
                    const updated = [...paymentBreakup];
                    updated[index].amount = e.target.value;
                    setPaymentBreakup(updated);
                  }}
                  className="border p-3 rounded-lg w-40"
                />

                {item.paymentMode !== "cash" && (
                  <input
                    type="text"
                    placeholder="Reference Number"
                    value={item.referenceNumber}
                    onChange={(e) => {
                      const updated = [...paymentBreakup];
                      updated[index].referenceNumber = e.target.value;
                      setPaymentBreakup(updated);
                    }}
                    className="border p-3 rounded-lg w-60"
                  />
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (paymentBreakup.length === 1) {
                      toast.error("At least one payment mode is required");
                      return;
                    }

                    setPaymentBreakup(
                      paymentBreakup.filter((_, i) => i !== index),
                    );
                  }}
                  className="text-red-500 font-bold"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setPaymentBreakup([
                  ...paymentBreakup,
                  {
                    paymentMode: "cash",
                    amount: "",
                    referenceNumber: "",
                  },
                ])
              }
              className="text-green-700"
            >
              + Add Payment Mode
            </button>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4 mt-4">
            <div className="flex justify-between">
              <span>Total Receipt Amount</span>
              <span>₹ {totalAmount}</span>
            </div>

            <div className="flex justify-between">
              <span>Total Payment Split</span>
              <span>₹ {paymentTotal}</span>
            </div>

            <div className="flex justify-between font-bold">
              <span>Balance</span>

              <span
                className={
                  balanceAmount === 0 ? "text-green-600" : "text-red-600"
                }
              >
                ₹ {balanceAmount}
              </span>
            </div>
          </div>

          {/* PAYMENT MODE */}
          {/* <div className="grid grid-cols-2 gap-4">
            <select
              name="paymentMode"
              value={form.paymentMode}
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500"
              onChange={handleChange}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
              <option value="dd">DD</option>
            </select>

            {form.paymentMode !== "cash" && (
              <input
                name="referenceNumber"
                placeholder="Transaction ID / Ref No"
                value={form.referenceNumber}
                className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500"
                onChange={handleChange}
              />
            )}
          </div> */}

          {/* SUBMIT */}
          <button
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-lg shadow-md transition-all duration-300 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : id
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-yellow-500 hover:bg-yellow-600 text-black"
            }`}
          >
            {loading
              ? id
                ? "Updating..."
                : "Generating..."
              : id
                ? "Update Receipt"
                : "Generate Receipt"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default GenerateReceipt;

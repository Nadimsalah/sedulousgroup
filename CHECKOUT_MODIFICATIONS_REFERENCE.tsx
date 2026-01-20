/**
 * CHECKOUT PAGE MODIFICATIONS REFERENCE
 * 
 * This file shows the key sections that need to be modified in app/checkout/page.tsx
 * to implement the payment-before-documents flow.
 * 
 * IMPORTANT: This is a REFERENCE file showing what to change, not a complete replacement.
 */

// ============================================================================
// 1. ADD IMPORTS (at the top of the file, around line 13)
// ============================================================================

import { PaymentStep } from "@/components/checkout/payment-step"
import { createBookingWithPayment, updateBookingDocuments, checkPaymentStatus } from "@/app/actions/booking-payment"

// ============================================================================
// 2. UPDATE STATE VARIABLES (around line 36-64)
// ============================================================================

// CHANGE THIS:
const [currentStep, setCurrentStep] = useState(1) // 1: Personal Info, 2: Documents, 3: Confirm

// TO THIS:
const [currentStep, setCurrentStep] = useState(1) // 1: Personal Info, 2: Payment, 3: Documents, 4: Confirm

// ADD THESE NEW STATE VARIABLES:
const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null)
const [bookingId, setBookingId] = useState<string | null>(null)
const [paymentComplete, setPaymentComplete] = useState(false)

// ============================================================================
// 3. REPLACE handleContinueToDocuments FUNCTION (around line 200-204)
// ============================================================================

// REPLACE THIS FUNCTION:
const handleContinueToDocuments = async () => {
    if (await validatePersonalInfo()) {
        setCurrentStep(2)
    }
}

// WITH THIS:
const handleContinueToPayment = async () => {
    if (!(await validatePersonalInfo())) {
        return
    }

    setIsCreatingBooking(true)
    setError(null)

    try {
        // Create booking and get Stripe payment session
        const result = await createBookingWithPayment({
            carId: car!.id,
            carName: car!.name,
            customerName: `${formData.firstName} ${formData.lastName}`,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            drivingLicenseNumber: formData.drivingLicense,
            pickupLocation: tripDetails.pickupLocation,
            dropoffLocation: tripDetails.dropoffLocation,
            pickupDate: tripDetails.pickupDate,
            dropoffDate: tripDetails.dropoffDate,
            pickupTime: tripDetails.pickupTime,
            dropoffTime: tripDetails.dropoffTime,
            totalAmount: totalAmount,
            bookingType: bookingType,
            userId: user?.id || null,
            rentalDays: rentalDays,
        })

        // Store booking ID and Stripe client secret
        setBookingId(result.bookingId)
        setStripeClientSecret(result.clientSecret)
        setCurrentStep(2) // Move to payment step
    } catch (err) {
        console.error("Error creating booking:", err)
        setError(err instanceof Error ? err.message : "Failed to create booking")
    } finally {
        setIsCreatingBooking(false)
    }
}

// ============================================================================
// 4. ADD NEW PAYMENT HANDLER FUNCTIONS (after handleContinueToPayment)
// ============================================================================

const handlePaymentSuccess = async () => {
    setPaymentComplete(true)

    // Poll to verify payment status
    if (bookingId) {
        try {
            const status = await checkPaymentStatus(bookingId)
            if (status.paymentStatus === "paid") {
                setCurrentStep(3) // Move to documents step
            }
        } catch (err) {
            console.error("Error checking payment status:", err)
            // Still proceed to documents step as webhook will update
            setCurrentStep(3)
        }
    }
}

const handlePaymentError = (error: string) => {
    setError(`Payment failed: ${error}`)
    setIsCreatingBooking(false)
}

const handleContinueToDocuments = () => {
    if (!paymentComplete) {
        setError("Please complete payment first")
        return
    }
    setCurrentStep(3)
}

// ============================================================================
// 5. UPDATE handleContinueToConfirm FUNCTION (around line 206-213)
// ============================================================================

// CHANGE THIS:
const handleContinueToConfirm = () => {
    if (!documentsComplete) {
        setError("Please complete all required document uploads")
        return
    }
    setError(null)
    setCurrentStep(3)
}

// TO THIS:
const handleContinueToConfirm = () => {
    if (!documentsComplete) {
        setError("Please complete all required document uploads")
        return
    }
    setError(null)
    setCurrentStep(4) // Changed from 3 to 4
}

// ============================================================================
// 6. REPLACE handleSubmitBooking FUNCTION (around line 220-276)
// ============================================================================

// REPLACE THIS ENTIRE FUNCTION WITH:
const handleSubmitBooking = async () => {
    if (!bookingId || !documentData) {
        setError("Missing booking or document data")
        return
    }

    if (!documentsComplete) {
        setError("Please complete all required document uploads")
        return
    }

    if (!paymentComplete) {
        setError("Payment must be completed before submitting")
        return
    }

    setIsCreatingBooking(true)
    setError(null)

    try {
        // Update existing booking with document data
        const result = await updateBookingDocuments(bookingId, {
            niNumber: documentData.niNumber,
            drivingLicenseFrontUrl: documentData.documents.licenseFront.url,
            drivingLicenseBackUrl: documentData.documents.licenseBack.url,
            proofOfAddressUrl: documentData.documents.proofOfAddress.url,
            bankStatementUrl: documentData.documents.bankStatement?.url || null,
            privateHireLicenseFrontUrl: documentData.documents.privateHireLicenseFront?.url || null,
            privateHireLicenseBackUrl: documentData.documents.privateHireLicenseBack?.url || null,
        })

        if (!result.success) {
            throw new Error("Failed to update booking with documents")
        }

        // Redirect to confirmation page
        router.push(`/confirmation?bookingId=${bookingId}`)
    } catch (err) {
        console.error("Error updating booking:", err)
        setError(err instanceof Error ? err.message : "Failed to update booking")
        setIsCreatingBooking(false)
    }
}

// ============================================================================
// 7. UPDATE STEP INDICATORS UI (find the step indicator section, around line 300-350)
// ============================================================================

// FIND THE STEP INDICATOR SECTION AND UPDATE IT TO SHOW 4 STEPS:
// Step 1: Personal Information
// Step 2: Payment (NEW)
// Step 3: Documents
// Step 4: Confirm

// Example structure:
<div className="flex items-center justify-center gap-2 mb-8">
    {/* Step 1 */}
    <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-white' : 'text-gray-500'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-red-500' : 'bg-gray-700'}`}>
            1
        </div>
        <span className="hidden sm:inline">Personal Info</span>
    </div>

    <div className="w-12 h-0.5 bg-gray-700" />

    {/* Step 2 - Payment (NEW) */}
    <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-white' : 'text-gray-500'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-red-500' : 'bg-gray-700'}`}>
            2
        </div>
        <span className="hidden sm:inline">Payment</span>
    </div>

    <div className="w-12 h-0.5 bg-gray-700" />

    {/* Step 3 - Documents */}
    <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-white' : 'text-gray-500'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-red-500' : 'bg-gray-700'}`}>
            3
        </div>
        <span className="hidden sm:inline">Documents</span>
    </div>

    <div className="w-12 h-0.5 bg-gray-700" />

    {/* Step 4 - Confirm */}
    <div className={`flex items-center gap-2 ${currentStep >= 4 ? 'text-white' : 'text-gray-500'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 4 ? 'bg-red-500' : 'bg-gray-700'}`}>
            4
        </div>
        <span className="hidden sm:inline">Confirm</span>
    </div>
</div>

// ============================================================================
// 8. ADD PAYMENT STEP RENDERING (find where steps are rendered, around line 400-600)
// ============================================================================

// FIND THE SECTION WHERE STEPS ARE RENDERED AND ADD THIS AFTER STEP 1:

{/* Step 2: Payment */ }
{
    currentStep === 2 && stripeClientSecret && car && (
        <div className="space-y-6">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-2">Payment</h2>
                <p className="text-gray-400">
                    Complete your payment to proceed with document upload
                </p>
            </div>

            <PaymentStep
                clientSecret={stripeClientSecret}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                totalAmount={totalAmount}
                carName={car.name}
            />
        </div>
    )
}

// ============================================================================
// 9. UPDATE DOCUMENTS STEP RENDERING (change currentStep === 2 to currentStep === 3)
// ============================================================================

// FIND THIS LINE:
{
    currentStep === 2 && (

        // CHANGE IT TO:
        { currentStep === 3 && (

            // ALSO UPDATE THE BUTTON:
            // FIND:
            onClick = { handleContinueToConfirm }

// MAKE SURE IT STILL CALLS handleContinueToConfirm

// ============================================================================
// 10. UPDATE CONFIRM STEP RENDERING (change currentStep === 3 to currentStep === 4)
// ============================================================================

// FIND THIS LINE:
{
        currentStep === 3 && (

            // CHANGE IT TO:
            { currentStep === 4 && (

// ============================================================================
// END OF MODIFICATIONS
// ============================================================================

/**
 * SUMMARY OF CHANGES:
 * 
 * 1. Added imports for PaymentStep and booking-payment actions
 * 2. Updated currentStep to support 4 steps (added payment step)
 * 3. Added state for stripeClientSecret, bookingId, paymentComplete
 * 4. Renamed handleContinueToDocuments to handleContinueToPayment
 * 5. Added handlePaymentSuccess and handlePaymentError functions
 * 6. Updated handleSubmitBooking to use updateBookingDocuments
 * 7. Updated step indicators to show 4 steps
 * 8. Added PaymentStep component rendering
 * 9. Updated step numbers for Documents (2→3) and Confirm (3→4)
 * 
 * TESTING:
 * - Test full flow: Personal Info → Payment → Documents → Confirm
 * - Verify payment with test card 4242 4242 4242 4242
 * - Ensure documents can only be uploaded after payment
 * - Check webhook updates booking status correctly
 */

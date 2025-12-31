"use client"

import { useEffect } from "react"
import { Card } from "@/components/ui/card"

export default function RentalAgreementPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Rental Agreement Terms & Conditions</h1>
          <div className="w-24 h-1 bg-red-600 mx-auto"></div>
        </div>

        {/* Section 1 */}
        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">1. YOUR CONTRACT WITH US</h2>
          <p className="text-gray-300">
            When you sign the form over the page you accept the conditions set out in this rental agreement. Please read
            this rental agreement carefully. If there is anything you do not understand or do not agree with, please ask
            a member of staff.
          </p>
        </Card>

        {/* Section 2 */}
        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">2. RENTAL PERIOD</h2>
          <p className="text-gray-300">
            You will have the vehicle for the rental period shown in the agreement. We may agree to extend the rental,
            but the period may never be more than 30 days. If you do not bring the vehicle back on time you are breaking
            the conditions of this agreement. We can charge you for every day you have the vehicle after it was due back
            until the vehicle is returned, we will charge you the dally rate published at the place you received the
            vehicle from.
          </p>
        </Card>

        {/* Section 3 */}
        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">3. YOUR RESPONSIBILITIES</h2>
          <ul className="space-y-3 text-gray-300">
            <li>
              • You must look after the vehicle and the keys to the vehicle. You must always lock the vehicle when not
              in use and use any security device fitted or supplied with the vehicle. You must protect the vehicle
              against bad weather, which may cause damage. You must make sure you use the correct fuel!
            </li>
            <li>
              • You are responsible for any damage to the vehicle caused by hitting low level objects, such as bridges
              or branches.
            </li>
            <li>
              • You must not sell, rent, or dispose of the vehicle or any of its parts. You must not give at anytime any
              legal rights over the vehicle.
            </li>
            <li>
              • You must not let anyone work on the vehicle without our permission. If we do give you permission, we
              will only give you a refund if you have a receipt for the work done.
            </li>
            <li>• You must let us know as soon as you become aware of a fault in the vehicle.</li>
            <li>
              • You must bring the vehicle back to the place we agreed, during the opening hours shown in the office. A
              member of staff must see the vehicle to check that it is in good condition. If we agree that you may
              return out of office hours, you will remain responsible for the vehicle and its condition until a member
              of staff has inspected it.
            </li>
            <li>
              • You will have to pay for reasonable costs of repair if:
              <ul className="ml-6 mt-2 space-y-1">
                <li>
                  – We have to pay extra costs to return the vehicle to its condition when the pre-rental inspection was
                  carried out.
                </li>
                <li>– You have damaged the interior of the vehicle.</li>
              </ul>
            </li>
            <li>• Before you return the vehicle, you must make sure you have emptied your belongings out.</li>
          </ul>
        </Card>

        {/* Section 4 */}
        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">4. OUR RESPONSIBILITIES</h2>
          <div className="space-y-3 text-gray-300">
            <p>
              We have maintained the vehicle to at least manufacturer's recommended standards. We assure you that the
              vehicle is roadworthy and suitable for renting at the start of the rental period also, if you are not
              renting the vehicle for business purposes, we are responsible for loss caused by:
            </p>
            <ul className="ml-6 space-y-2">
              <li>– The vehicle not being fit to drive off.</li>
              <li>– Us not having the legal rights to rent out the vehicle.</li>
            </ul>
            <p className="mt-3">
              We are responsible if someone is injured or dies as a result of our negligence, act or failure to act we
              are also responsible for losses you suffer as a result of us breaking this agreement if the losses are a
              feasible consequence of us breaking the agreement. Losses are feasible where they could be contemplated by
              you and us at the time where the vehicle is released. We are not responsible for indirect losses, which
              happen as a side effect as the main loss or damage, and which are not feasible by you and us.
            </p>
          </div>
        </Card>

        {/* Section 5 */}
        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">5. PROPERTY</h2>
          <p className="text-gray-300">
            We are only responsible for loss or damage to property left in the vehicle if the loss or damage results
            from our negligence or a breach of contact.
          </p>
        </Card>

        {/* Section 6 */}
        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">6. CONDITIONS FOR USING THE VEHICLE</h2>
          <div className="space-y-3 text-gray-300">
            <p>
              The vehicle must only be driven by you and any other persons named overleaf, or by anyone we authorise in
              writing. Anyone driving the vehicle must have a full valid license.
            </p>
            <p className="font-semibold text-white">You and other drivers must not:</p>
            <ul className="space-y-2 ml-4">
              <li>• Use the vehicle for hire or reward.</li>
              <li>
                • Use the vehicle for any illegal purpose. Use the vehicle for racing, pacemaking, testing the vehicles'
                reliability and speed or teaching someone to drive.
              </li>
              <li>
                • Use the vehicle while under the influence of drugs or alcohol. Drive the vehicle outside England,
                Scotland, and Wales, unless we have given you written permission.
              </li>
              <li>
                • Lead the vehicle beyond the manufacturers' maximum weight recommendations and make sure that the load
                is safely secured.
              </li>
              <li>
                • If the vehicle as a commercial vehicle, use it for a purpose for which you need an operator's license
                if you do not have one.
              </li>
            </ul>
          </div>
        </Card>

        {/* Section 7 */}
        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">7. TOWING</h2>
          <p className="text-gray-300">
            You are permitted to use the vehicle for towing unless we have given you written permission.
          </p>
        </Card>

        {/* Section 8 */}
        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">8. CHARGES</h2>
          <div className="space-y-3 text-gray-300">
            <p>
              We work out our charges using our current price list, as shown over the pages you will pay the following
              charges.
            </p>
            <ul className="space-y-2">
              <li>
                <span className="font-semibold text-white">A.</span> The rental and any other charges we work out
                according to this agreement.
              </li>
              <li>
                <span className="font-semibold text-white">B.</span> Any charges resulting in loss or damage from you
                not keeping to condition 3.
              </li>
              <li>
                <span className="font-semibold text-white">C.</span> A refuelling service charge if you have used, or
                not replaced, the quantity of fuel that we supplied at the start of the original rental. The charge will
                be based on the rates printed on the rental agreement or at the office you rented from.
              </li>
              <li>
                <span className="font-semibold text-white">D.</span> All fines and court costs for parking, traffic, or
                other offenses. You must pay any fines and costs if and when the authority demands this payment. If you
                do not, you will pay the fine and any administration charges set out by the renting office.
              </li>
              <li>
                <span className="font-semibold text-white">E.</span> The reasonable cost of repairing any extra damage
                which was not noted on our vehicle check form at the start of the rental agreement, whether you were at
                fault or not (depending on 4) and the reasonable cost of replacing the vehicle if it is stolen.
                Depending on any insurance you have (as set out in 9) if and when we demand this payment.
              </li>
              <li>
                <span className="font-semibold text-white">F.</span> A loss of income charge, when we demand it, if we
                cannot rent out the vehicle because it needs to be repaired, it is a write off, or has been stolen and
                we are waiting to receive full payment of the vehicle value. We will only charge you for loss of income
                if we can't get back the losses under the Insurance Programme. We will charge at the published daily
                rate, and we will always do everything we can to make sure the vehicle is repaired, or we get payment as
                soon as possible.
              </li>
              <li>
                <span className="font-semibold text-white">G.</span> Any charges arising from Customs and Excise seizing
                the vehicle, together with a loss of income charge while we cannot rent out the vehicle, if and when we
                demand this payment.
              </li>
              <li>
                <span className="font-semibold text-white">H.</span> Any published rates for delivering and collecting
                the vehicle.
              </li>
              <li>
                <span className="font-semibold text-white">I.</span> Interest which we will add every day to any amount
                you do not pay us on time at a rate of 4% a year above the base lending rate of Barclays Bank from time
                to time.
              </li>
              <li>
                <span className="font-semibold text-white">J.</span> VAT and any other taxes on any of the charges lined
                above, at appropriate. You are responsible for all charges, even if you have asked someone else to be
                responsible for them. You can get details of our Insurance Programme from the office you rented the
                vehicle from.
              </li>
            </ul>
          </div>
        </Card>

        {/* Continue with remaining sections... */}
        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">9. OUR INSURANCE & DAMAGE PROTECTION PROGRAMME</h2>
          <div className="space-y-3 text-gray-300">
            <p>
              If we arrange separate insurance, we will give you separate information on the insurance cover and any
              restrictions which may apply otherwise, the condition of our insurance programme will apply. By signing
              the agreement over the page, you are accepting the conditions of our insurance programme.
            </p>
            <ul className="space-y-2">
              <li>
                <span className="font-semibold text-white">A.</span> We have a legal responsibility to have third party
                insurance. This provides cover for claims made if you injure or kill anybody, or damage their property
                (cover for damage to property is limited to £5,000,000)
              </li>
              <li>
                <span className="font-semibold text-white">B.</span> We will provide cover for loss or damage to the
                vehicle if you have initialled the line marked loss damage' over the page. If you accept this, you will
                have to pay an amount up to the 'excess' every time you damage the vehicle.
              </li>
              <li>
                <span className="font-semibold text-white">C.</span> We will provide cover for theft and damage to the
                vehicle caused during an attempted theft if you have initialled the line marked 'theft of rental
                vehicle' over the page. If you accept this, you still have to pay an amount up to the 'excess if the
                vehicle is stolen. The excess amount you have to pay in each case is shown overleaf.
              </li>
              <li>
                <span className="font-semibold text-white">D.</span> We will provide personal accident insurance and
                personal belongings insurance if you initialled the appropriate line overleaf. You can get details of
                all insurance protection from the office you rented the vehicle from.
              </li>
            </ul>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">10. YOUR INSURANCE</h2>
          <p className="text-gray-300">
            If we have agreed as indicated under 'insurance datils' overleaf, you may arrange your own insurance for the
            full duration of the rental as long as you can prove that this insurance is valid, and you have signed to
            confirm this over the page. We have to agree to the amount of cover you arrange, the type of policy and the
            insurer you have chosen. We must be satisfied with the cover and policy conditions, and you must not change
            them. We may ask your insurers to record our name as owners of the vehicle. If the vehicle is damaged or
            stolen, you will let us negotiate with the insurers about whether the vehicle can be repaired or when
            compensations due to us. You are financially responsible for settling the full claim and paying all costs if
            the policy you have arranged fails and the vehicle is damaged, lost or stolen, or a claim as made by any
            other party.
          </p>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">11. IN THE EVENT OF AN ACCIDENT</h2>
          <div className="space-y-3 text-gray-300">
            <p>
              If you have an accident, you must NOT admit liability. You should put the names and addresses of everybody
              involved, including witnesses. You should also:
            </p>
            <ul className="ml-6 space-y-2">
              <li>– Make the vehicle secure.</li>
              <li>
                – Tell the police straight away if anyone is injured or there is a disagreement over who is responsible.
              </li>
              <li>
                – Inform the office you rented from. You must fill out an accident report form, which we will be
                completed with a member of staff.
              </li>
            </ul>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">12. DATA PROTECTION</h2>
          <p className="text-gray-300">
            You agree that we may use any information you have given us to carry out our own market research. If you
            break this agreement, we can give the information to credit reference agencies, the Driver, and the Vehicle
            Licensing Agency (DVLA), debt collectors and any other relevant organisation. We can also give this
            information to the British Vehicle Rental and Leasing Association (BVRLA), who can pass it on to any of its
            members for any purpose show in the Data Protection Act 1998.
          </p>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">13. ENDING THE AGREEMENT</h2>
          <div className="space-y-3 text-gray-300">
            <p>
              <span className="font-semibold text-white">A.</span> If you are a consumer, we will end this agreement
              straight away if we find out that your belongings have been taken away from you to pay off your debts, or
              a receiving order has been made against you. We may end this agreement if you do not meet any of the
              conditions in this agreement.
            </p>
            <p>
              <span className="font-semibold text-white">B.</span> If you are a company, we will end this agreement
              straight away if:
            </p>
            <ul className="ml-6 space-y-1">
              <li>– You go into liquidation.</li>
              <li>– You call a meeting of creditors.</li>
              <li>– We find out that your goods have been taken to pay off your debts.</li>
              <li>– You do not meet any of the conditions in this agreement.</li>
            </ul>
            <p>
              <span className="font-semibold text-white">C.</span> If we end this agreement, it will not affect our
              right to receive any money we are owed under the conditions of this agreement. We can also claim
              reasonable costs from you if you do not meet any of the conditions of this agreement. We can repossess the
              vehicle (and charge you a reasonable amount) without using unreasonable force or causing damage.
            </p>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">14. ADDITIONAL CHARGES</h2>
          <div className="space-y-2 text-gray-300">
            <p>
              As well as damage to the interior and exterior of the vehicle we reserve the right in charge for any of
              the following:
            </p>
            <ul className="ml-6 space-y-2">
              <li>
                – Deodorising bomb to clear the smell of cigarette smoke or any other offensive smeils in the vehicle.
              </li>
              <li>
                – Full valet charge of £55 if the vehicle is returned and smells of smoke, has ash in the interior or
                shows signs of being smoked in
              </li>
              <li>– Wet vac interior charge for any stains or soiling of the interior of the vehicle.</li>
            </ul>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">15. EXCESS PROTECTION</h2>
          <p className="text-gray-300">
            The additional insurance of Excess protection allows the renter to be refunded in the event that funds are
            taken from the customer if the vehicle is damaged in anyway, If excess protection is taken out by the
            customer the maximum amount that they will be due to pay in the event of damage, recover or replacement of
            the vehicle is £2000 which will be refunded by their excess protection insurance policy,
          </p>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">16. GOVERNING LAW</h2>
          <p className="text-gray-300">
            That laws of the country in which it is signed governs this agreement. Any dispute may be settled in the
            court of that country.
          </p>
        </Card>

        {/* Web Agreement Section */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            AGREEMENT BETWEEN USER AND Sedulous Group Ltd
          </h1>

          <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
            <p className="text-gray-300">
              This Web Site is comprised of various Web pages operated by Sedulous Group Ltd. This Web Site is offered
              to you conditioned on your acceptance without modification of the terms, conditions, and notices contained
              herein. Your use of this Web Site constitutes your agreement to all such terms, conditions, and notices.
            </p>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">MODIFICATION OF THESE TERMS OF USE</h2>
            <p className="text-gray-300">
              Sedulous Group Ltd reserves the right to change the terms, conditions, and notices under which this Web
              Site is offered, including but not limited to the charges associated with the use of This Web Site.
            </p>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">LINKS TO THIRD PARTY SITES</h2>
            <p className="text-gray-300 mb-3">
              This Web Site may contain links to other Web Sites ("Linked Sites"). The Linked Sites are not under the
              control of Sedulous Group Ltd and Sedulous Group Ltd is not responsible for the contents of any Linked
              Site, including without limitation any link contained in a Linked Site, or any changes or updates to a
              Linked Site.
            </p>
            <p className="text-gray-300">
              Sedulous Group Ltd is not responsible for webcasting or any other form of transmission received from any
              Linked Site. Sedulous Group Ltd is providing these links to you only as a convenience, and the inclusion
              of any link does not imply endorsement by Sedulous Group Ltd of the site or any association with its
              operators.
            </p>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">NO UNLAWFUL OR PROHIBITED USE</h2>
            <p className="text-gray-300">
              As a condition of your use of this Web Site, you warrant to Sedulous Group Ltd that you will not use this
              Web Site for any purpose that is unlawful or prohibited by these terms, conditions, and notices. You may
              not use this Web Site in any manner which could damage, disable, overburden, or impair this Web Site or
              interfere with any other party's use and enjoyment of This Web Site. You may not obtain or attempt to
              obtain any materials or information through any means not intentionally made available or provided for
              through This Web Sites.
            </p>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">LIABILITY DISCLAIMER</h2>
            <p className="text-gray-300 uppercase">
              THE INFORMATION, SOFTWARE, PRODUCTS, AND SERVICES INCLUDED IN OR AVAILABLE THROUGH THE Sedulous Group LTD
              WEB SITE MAY INCLUDE INACCURACIES OR TYPOGRAPHICAL ERRORS. CHANGES ARE PERIODICALLY ADDED TO THE
              INFORMATION HEREIN. Sedulous Group Ltd AND/OR ITS SUPPLIERS MAY MAKE IMPROVEMENTS AND/OR CHANGES IN THIS
              WEB SITE AT ANY TIME. ADVICE RECEIVED VIA THIS WEB SITE SHOULD NOT BE RELIED UPON FOR PERSONAL, MEDICAL,
              LEGAL OR FINANCIAL DECISIONS AND YOU SHOULD CONSULT AN APPROPRIATE PROFESSIONAL FOR SPECIFIC ADVICE
              TAILORED TO YOUR SITUATION.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

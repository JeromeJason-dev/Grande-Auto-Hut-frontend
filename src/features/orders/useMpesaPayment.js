import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as paymentsApi from "../../api/payments";
import { extractErrorMessage } from "../../api/client";

const FIRST_CHECK_DELAY_MS = 4000; // give the customer a moment to see the prompt
const POLL_INTERVAL_MS = 3000;
const MAX_CHECKS = 40; // ~2 minutes; the STK prompt itself expires well before that
const MAX_CONSECUTIVE_ERRORS = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends an M-Pesa STK prompt and follows it to a final outcome.
 *
 * state: "idle" | "sending" | "waiting" | "paid" | "failed" | "timeout" | "error"
 *   paid    - Safaricom confirmed the payment
 *   failed  - the customer cancelled, entered a wrong PIN, had insufficient funds, or the prompt expired
 *   timeout - no answer yet after ~2 minutes (the payment may still complete; check again)
 *   error   - the prompt could not be sent, or the status could not be read (see `error`)
 *
 * The backend asks Safaricom directly on every poll, so this works even when
 * Safaricom's callback is delayed or can't reach the server (e.g. local dev).
 */
export function useMpesaPayment() {
  const queryClient = useQueryClient();
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");
  const run = useRef(0); // bumping this cancels any poll loop already in flight

  useEffect(
    () => () => {
      run.current += 1; // stop polling when the component unmounts
    },
    []
  );

  const refreshOrder = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["order"] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [queryClient]);

  /** Polls until the payment settles. `immediate` skips the initial wait (use when resuming). */
  const check = useCallback(
    async (orderId, { immediate = false } = {}) => {
      const myRun = (run.current += 1);
      const cancelled = () => myRun !== run.current;
      setState("waiting");
      setError("");
      if (!immediate) await sleep(FIRST_CHECK_DELAY_MS);

      let consecutiveErrors = 0;
      for (let i = 0; i < MAX_CHECKS; i += 1) {
        if (cancelled()) return null;
        try {
          const payment = await paymentsApi.getMpesaStatus(orderId);
          if (cancelled()) return null;
          consecutiveErrors = 0;
          if (payment.status === "success") {
            setState("paid");
            refreshOrder();
            return "paid";
          }
          if (payment.status === "failed") {
            setState("failed");
            refreshOrder();
            return "failed";
          }
          if (payment.status === "none") {
            setState("idle");
            return "none";
          }
        } catch (err) {
          if (cancelled()) return null;
          consecutiveErrors += 1;
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            setError(extractErrorMessage(err));
            setState("error");
            return "error";
          }
        }
        await sleep(POLL_INTERVAL_MS);
      }
      if (cancelled()) return null;
      setState("timeout");
      refreshOrder();
      return "timeout";
    },
    [refreshOrder]
  );

  /** Sends a (new) STK prompt for the order, then follows it. */
  const start = useCallback(
    async (orderId, phoneNumber) => {
      const myRun = (run.current += 1);
      setState("sending");
      setError("");
      try {
        await paymentsApi.initiateMpesa(orderId, phoneNumber);
      } catch (err) {
        if (myRun !== run.current) return null;
        setError(extractErrorMessage(err));
        setState("error");
        refreshOrder();
        return "error";
      }
      if (myRun !== run.current) return null;
      return check(orderId);
    },
    [check, refreshOrder]
  );

  return { state, error, start, check };
}
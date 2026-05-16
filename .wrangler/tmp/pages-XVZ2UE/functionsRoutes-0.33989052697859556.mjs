import { onRequestGet as __api_access_profile_js_onRequestGet } from "C:\\Users\\Admin\\Documents\\GitHub\\SarvamSai\\functions\\api\\access-profile.js"
import { onRequestGet as __api_admin_orders_js_onRequestGet } from "C:\\Users\\Admin\\Documents\\GitHub\\SarvamSai\\functions\\api\\admin-orders.js"
import { onRequestGet as __api_admin_orders_csv_js_onRequestGet } from "C:\\Users\\Admin\\Documents\\GitHub\\SarvamSai\\functions\\api\\admin-orders-csv.js"
import { onRequestGet as __api_admin_razorpay_reconcile_js_onRequestGet } from "C:\\Users\\Admin\\Documents\\GitHub\\SarvamSai\\functions\\api\\admin-razorpay-reconcile.js"
import { onRequestPost as __api_admin_razorpay_reconcile_js_onRequestPost } from "C:\\Users\\Admin\\Documents\\GitHub\\SarvamSai\\functions\\api\\admin-razorpay-reconcile.js"
import { onRequestGet as __api_availability_today_js_onRequestGet } from "C:\\Users\\Admin\\Documents\\GitHub\\SarvamSai\\functions\\api\\availability-today.js"
import { onRequestPost as __api_create_order_js_onRequestPost } from "C:\\Users\\Admin\\Documents\\GitHub\\SarvamSai\\functions\\api\\create-order.js"
import { onRequestGet as __api_orders_by_email_js_onRequestGet } from "C:\\Users\\Admin\\Documents\\GitHub\\SarvamSai\\functions\\api\\orders-by-email.js"
import { onRequestGet as __api_payment_config_js_onRequestGet } from "C:\\Users\\Admin\\Documents\\GitHub\\SarvamSai\\functions\\api\\payment-config.js"
import { onRequestPost as __api_send_darshan_invite_js_onRequestPost } from "C:\\Users\\Admin\\Documents\\GitHub\\SarvamSai\\functions\\api\\send-darshan-invite.js"
import { onRequestPost as __api_sync_orders_to_sheet_js_onRequestPost } from "C:\\Users\\Admin\\Documents\\GitHub\\SarvamSai\\functions\\api\\sync-orders-to-sheet.js"
import { onRequestPost as __api_test_darshan_email_js_onRequestPost } from "C:\\Users\\Admin\\Documents\\GitHub\\SarvamSai\\functions\\api\\test-darshan-email.js"
import { onRequestPost as __api_validate_access_js_onRequestPost } from "C:\\Users\\Admin\\Documents\\GitHub\\SarvamSai\\functions\\api\\validate-access.js"
import { onRequestPost as __api_verify_passphrase_js_onRequestPost } from "C:\\Users\\Admin\\Documents\\GitHub\\SarvamSai\\functions\\api\\verify-passphrase.js"
import { onRequestPost as __api_verify_payment_js_onRequestPost } from "C:\\Users\\Admin\\Documents\\GitHub\\SarvamSai\\functions\\api\\verify-payment.js"
import { onRequest as __api___path___js_onRequest } from "C:\\Users\\Admin\\Documents\\GitHub\\SarvamSai\\functions\\api\\[[path]].js"

export const routes = [
    {
      routePath: "/api/access-profile",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_access_profile_js_onRequestGet],
    },
  {
      routePath: "/api/admin-orders",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_orders_js_onRequestGet],
    },
  {
      routePath: "/api/admin-orders-csv",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_orders_csv_js_onRequestGet],
    },
  {
      routePath: "/api/admin-razorpay-reconcile",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_razorpay_reconcile_js_onRequestGet],
    },
  {
      routePath: "/api/admin-razorpay-reconcile",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_razorpay_reconcile_js_onRequestPost],
    },
  {
      routePath: "/api/availability-today",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_availability_today_js_onRequestGet],
    },
  {
      routePath: "/api/create-order",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_create_order_js_onRequestPost],
    },
  {
      routePath: "/api/orders-by-email",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_orders_by_email_js_onRequestGet],
    },
  {
      routePath: "/api/payment-config",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_payment_config_js_onRequestGet],
    },
  {
      routePath: "/api/send-darshan-invite",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_send_darshan_invite_js_onRequestPost],
    },
  {
      routePath: "/api/sync-orders-to-sheet",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_sync_orders_to_sheet_js_onRequestPost],
    },
  {
      routePath: "/api/test-darshan-email",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_test_darshan_email_js_onRequestPost],
    },
  {
      routePath: "/api/validate-access",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_validate_access_js_onRequestPost],
    },
  {
      routePath: "/api/verify-passphrase",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_verify_passphrase_js_onRequestPost],
    },
  {
      routePath: "/api/verify-payment",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_verify_payment_js_onRequestPost],
    },
  {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___path___js_onRequest],
    },
  ]
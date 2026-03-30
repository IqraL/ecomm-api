import { ServerClient } from "postmark";
import dotenv from "dotenv";
import { OrderDocument } from "../../types";

dotenv.config();

export const sendEmail = async ({ order }: { order: OrderDocument }) => {
  try {
    const client = new ServerClient(process.env.postmark_key ?? "");

    // Calculate Total
    const totalAmount = order.cartItems.reduce((acc, item) => {
      const price = item.discounted
        ? item.discountedPrice ?? item.price
        : item.price;
      return acc + price * item.quantity;
    }, 0);

    // Generate Table Rows for Items
    const itemRows = order.cartItems
      .map(
        (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee;">
        <img src="${
          item.imgs[0]
        }" width="50" height="50" style="border-radius: 4px; object-fit: cover; vertical-align: middle; margin-right: 10px;" />
        <span style="font-weight: 600; color: #333333;">${item.name}</span>
        <br/>
        <small style="color: #888888; margin-left: 60px;">${item.size} / ${
          item.color
        }</small>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; text-align: center; color: #666666;">
        x${item.quantity}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; text-align: right; font-weight: 600; color: #333333;">
        £${item.discounted ? item.discountedPrice : item.price}
      </td>
    </tr>
  `
      )
      .join("");

    const htmlBody = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 0;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <tr>
          <td style="padding: 40px 40px 20px 40px; text-align: center;">
            <h1 style="margin: 0; color: #1a1a1a; font-size: 24px;">Order Confirmed!</h1>
            <p style="color: #666666; font-size: 16px; margin-top: 10px;">Hi ${
              order.email ?? ""
            }, your order is being prepared.</p>
          </td>
        </tr>

        <tr>
          <td style="padding: 0 40px;">
            <div style="background-color: #fdfdfd; border: 1px solid #efefef; padding: 15px; border-radius: 6px;">
              <table width="100%">
                <tr>
                  <td style="font-size: 12px; color: #888888; text-transform: uppercase;">Order ID</td>
                  <td style="font-size: 12px; color: #888888; text-transform: uppercase; text-align: right;">Status</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; font-weight: bold; color: #333333;">#${order.orderId.toUpperCase()}</td>
                  <td style="font-size: 14px; font-weight: bold; color: #2ecc71; text-align: right;">Paid</td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding: 20px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${itemRows}
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding: 0 40px 40px 40px;">
            <table width="100%" style="border-top: 2px solid #1a1a1a; padding-top: 20px;">
              <tr>
                <td style="font-size: 18px; font-weight: bold; color: #1a1a1a;">Total Paid</td>
                <td style="font-size: 18px; font-weight: bold; color: #1a1a1a; text-align: right;">£${totalAmount.toFixed(
                  2
                )}</td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding: 20px; background-color: #1a1a1a; text-align: center;">
            <p style="color: #ffffff; font-size: 12px; margin: 0;">&copy;</p>
          </td>
        </tr>
      </table>
    </div>
  `;

    return client.sendEmail({
      From: "iqra@colorgridcreative.com",
      To: "sales@ColorGridCreative.com",
      Subject: `Order Confirmation #${order.orderId.toUpperCase()}`,
      HtmlBody: htmlBody,
    });
  } catch (error) {
    console.log(error);
  }
};

// pages/api/network/connect.ts
// API for sending and managing connection requests
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "../../../lib/auth";
import mongoose from "mongoose";
import User from "../../../models/User";
import Person from "../../../models/Person";
import ConnectionRequest from "../../../models/ConnectionRequest";
import ContactEdge from "../../../models/ContactEdge";
import ContactAlias from "../../../models/ContactAlias";
import BlockedContact from "../../../models/BlockedContact";
import { getConnectionPathDetails } from "../../../lib/networkPath";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const user: any = (req as any).user;

  if (!user?.sub) {
    return res.status(401).json({ ok: false, code: "UNAUTHORIZED" });
  }

  // Ensure database connection
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, {});
  }

  try {
    const caller = await User.findById(user.sub).lean();
    if (!caller || !caller.personId) {
      return res.status(404).json({ ok: false, code: "NOT_FOUND", message: "Person not found for user" });
    }
    const fromPersonId = caller.personId;

    switch (method) {
      case "POST": {
        // Send connection request
        const { toPersonId, message } = req.body;
        if (!toPersonId) {
          return res.status(400).json({ ok: false, code: "VALIDATION_ERROR", message: "toPersonId is required" });
        }

        // Check if user is blocked
        const toPerson = await Person.findById(toPersonId).lean();
        if (toPerson) {
          const isBlocked = await BlockedContact.findOne({
            userId: user.sub,
            $or: [
              { personId: toPersonId },
              { phoneNumber: toPerson.phones?.[0]?.value || toPerson.phones?.[0]?.e164 },
            ],
          }).lean();

          if (isBlocked) {
            return res.status(403).json({
              ok: false,
              code: "BLOCKED",
              message: "Cannot send request to blocked contact",
            });
          }
        }

        // Check if already connected
        const existingEdge = await ContactEdge.findOne({
          fromPersonId,
          toPersonId,
        }).lean();

        if (existingEdge) {
          return res.status(400).json({ ok: false, code: "ALREADY_CONNECTED", message: "Already connected to this person" });
        }

        // Check for existing requests (including rejected ones)
        const existingRequests = await ConnectionRequest.find({
          fromPersonId,
          toPersonId,
        })
          .sort({ createdAt: -1 })
          .lean();

        // Check if there's a pending request
        const pendingRequest = existingRequests.find((r) => r.status === "pending");
        if (pendingRequest) {
          return res.status(400).json({
            ok: false,
            code: "REQUEST_EXISTS",
            message: "Connection request already sent",
            request: pendingRequest,
          });
        }

        // Check request count - max 2 requests allowed
        const rejectedRequests = existingRequests.filter((r) => r.status === "rejected");
        const totalRequestCount = existingRequests.reduce((sum, r) => sum + (r.requestCount || 1), 0);

        if (totalRequestCount >= 2) {
          return res.status(400).json({
            ok: false,
            code: "MAX_REQUESTS_REACHED",
            message: "Maximum number of connection requests (2) has been reached for this contact",
          });
        }

        // Create connection request
        const request = await ConnectionRequest.create({
          fromUserId: user.sub,
          fromPersonId,
          toPersonId,
          status: "pending",
          message: message || "",
          requestCount: totalRequestCount + 1,
        });

        return res.status(201).json({
          ok: true,
          request: {
            id: request._id.toString(),
            status: request.status,
            message: request.message,
            createdAt: request.createdAt,
            requestCount: request.requestCount,
          },
        });
      }

      case "PUT": {
        // Approve or reject connection request
        const { requestId, action } = req.body; // action: "approve" or "reject"
        if (!requestId || !action) {
          return res.status(400).json({ ok: false, code: "VALIDATION_ERROR", message: "requestId and action are required" });
        }

        const request = await ConnectionRequest.findById(requestId);
        if (!request) {
          return res.status(404).json({ ok: false, code: "NOT_FOUND", message: "Connection request not found" });
        }

        // Check if user is the recipient of the request
        if (request.toPersonId.toString() !== fromPersonId.toString()) {
          return res.status(403).json({ ok: false, code: "FORBIDDEN", message: "Not authorized to modify this request" });
        }

        if (request.status !== "pending") {
          return res.status(400).json({ ok: false, code: "INVALID_STATE", message: "Request is not pending" });
        }

        if (action === "approve") {
          // Update request status
          request.status = "approved";
          await request.save();

          // Create ContactEdge (bidirectional connection)
          await ContactEdge.findOneAndUpdate(
            { fromPersonId: request.fromPersonId, toPersonId: request.toPersonId },
            { weight: 1, lastContactedAt: new Date() },
            { upsert: true, new: true }
          );

          // Also create reverse edge if it doesn't exist (for mutual connection)
          await ContactEdge.findOneAndUpdate(
            { fromPersonId: request.toPersonId, toPersonId: request.fromPersonId },
            { weight: 1, lastContactedAt: new Date() },
            { upsert: true, new: true }
          );

          // Create ContactAlias for the requester (so they can see the contact)
          const toPerson = await Person.findById(request.toPersonId).lean();
          if (toPerson) {
            const aliasName = toPerson.emails?.[0]?.value || toPerson.phones?.[0]?.value || "Contact";
            await ContactAlias.findOneAndUpdate(
              { userId: request.fromUserId, personId: request.toPersonId },
              { alias: aliasName },
              { upsert: true, new: true }
            );
          }

          return res.status(200).json({
            ok: true,
            message: "Connection request approved",
            request: {
              id: request._id.toString(),
              status: request.status,
            },
          });
        } else if (action === "reject") {
          request.status = "rejected";
          await request.save();

          return res.status(200).json({
            ok: true,
            message: "Connection request rejected",
            request: {
              id: request._id.toString(),
              status: request.status,
            },
          });
        } else {
          return res.status(400).json({ ok: false, code: "INVALID_ACTION", message: "Action must be 'approve' or 'reject'" });
        }
      }

      case "GET": {
        // Get connection requests (pending, incoming, outgoing)
        const { type = "all" } = req.query; // "incoming", "outgoing", or "all"

        let query: any = {};
        if (type === "incoming") {
          query = { toPersonId: fromPersonId, status: "pending" };
        } else if (type === "outgoing") {
          query = { fromPersonId: fromPersonId };
        } else {
          query = {
            $or: [{ fromPersonId: fromPersonId }, { toPersonId: fromPersonId }],
          };
        }

        const requests = await ConnectionRequest.find(query)
          .populate("fromPersonId", "phones emails")
          .populate("toPersonId", "phones emails")
          .sort({ createdAt: -1 })
          .lean();

        const requestsWithDetails = await Promise.all(
          requests.map(async (req: any) => {
            const fromPerson = req.fromPersonId;
            const toPerson = req.toPersonId;
            const isIncoming = req.toPersonId.toString() === fromPersonId.toString();

            // Get alias for the other person
            const otherPersonId = isIncoming ? req.fromPersonId._id : req.toPersonId._id;
            const alias = await ContactAlias.findOne({
              userId: user.sub,
              personId: otherPersonId,
            }).lean();

            // For incoming requests, get connection path and full sender details
            let connectionPath = null;
            let senderDetails: any = null;

            if (isIncoming) {
              // Get connection path details
              connectionPath = await getConnectionPathDetails(
                fromPersonId,
                fromPerson._id,
                user.sub,
                2
              );

              // Get full sender details (phone, email)
              senderDetails = {
                phones: fromPerson.phones || [],
                emails: fromPerson.emails || [],
              };
            }

            return {
              id: req._id.toString(),
              status: req.status,
              message: req.message,
              isIncoming,
              requestCount: req.requestCount || 1,
              fromPerson: {
                id: fromPerson._id.toString(),
                name: alias?.alias || fromPerson.emails?.[0]?.value || fromPerson.phones?.[0]?.value || "Unknown",
                ...(isIncoming && senderDetails ? { phones: senderDetails.phones, emails: senderDetails.emails } : {}),
              },
              toPerson: {
                id: toPerson._id.toString(),
                name: toPerson.emails?.[0]?.value || toPerson.phones?.[0]?.value || "Unknown",
              },
              connectionPath: connectionPath
                ? {
                    level: connectionPath.level,
                    viaPersonName: connectionPath.viaPersonName,
                    description:
                      connectionPath.level === 1
                        ? "1st Connection"
                        : connectionPath.viaPersonName
                        ? `${connectionPath.level}nd Connection via ${connectionPath.viaPersonName}`
                        : `${connectionPath.level}nd Connection`,
                  }
                : null,
              createdAt: req.createdAt,
            };
          })
        );

        return res.status(200).json(requestsWithDetails);
      }

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT"]);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (err: any) {
    console.error("Connection request error:", err);
    return res.status(500).json({ ok: false, code: "INTERNAL_ERROR", message: "Failed to process connection request" });
  }
}

export default withAuth(handler);


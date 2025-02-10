import Booking from "../models/booking.js";
import Payment from "../models/payment.js";
import User from "../models/user.js";

export const getAdvancedAnalytics = async (req, res) => {
  try {
    // 1. Field Usage Analytics
    const fieldUsageStats = await Booking.aggregate([
      {
        $group: {
          _id: {
            field: "$field",
            month: { $month: { $dateFromString: { dateString: "$date" } } },
            year: { $year: { $dateFromString: { dateString: "$date" } } },
          },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$price" },
          averagePrice: { $avg: "$price" },
          uniqueUsers: { $addToSet: "$email" },
        },
      },
      {
        $project: {
          field: "$_id.field",
          month: "$_id.month",
          year: "$_id.year",
          totalBookings: 1,
          totalRevenue: 1,
          averagePrice: { $round: ["$averagePrice", 2] },
          uniqueUserCount: { $size: "$uniqueUsers" },
        },
      },
      {
        $sort: { year: -1, month: -1, totalRevenue: -1 },
      },
    ]);

    // 2. Payment Analytics with Time-Based Trends
    const paymentTrends = await Payment.aggregate([
      {
        $facet: {
          // Monthly revenue by payment type
          monthlyRevenue: [
            {
              $group: {
                _id: {
                  month: { $month: "$paymentDate" },
                  year: { $year: "$paymentDate" },
                  type: "$type",
                },
                revenue: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } },
          ],
          // Membership type distribution
          membershipStats: [
            {
              $match: { type: "gym_membership" },
            },
            {
              $group: {
                _id: "$membershipDetails.type",
                totalSold: { $sum: 1 },
                totalRevenue: { $sum: "$amount" },
                averagePrice: { $avg: "$amount" },
              },
            },
          ],
          // Payment status distribution
          paymentStatusStats: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
              },
            },
          ],
        },
      },
    ]);

    // 3. User Engagement Analytics
    const userEngagement = await User.aggregate([
      {
        $lookup: {
          from: "bookings",
          localField: "email",
          foreignField: "email",
          as: "bookings",
        },
      },
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "userId",
          as: "payments",
        },
      },
      {
        $project: {
          email: 1,
          role: 1,
          bookingCount: { $size: "$bookings" },
          totalSpent: { $sum: "$payments.amount" },
          lastActivity: { $max: "$payments.paymentDate" },
          membershipStatus: {
            $cond: {
              if: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: "$payments",
                        as: "payment",
                        cond: {
                          $and: [
                            { $eq: ["$$payment.type", "gym_membership"] },
                            { $eq: ["$$payment.status", "completed"] },
                          ],
                        },
                      },
                    },
                  },
                  0,
                ],
              },
              then: "Active",
              else: "Inactive",
            },
          },
        },
      },
      {
        $group: {
          _id: "$membershipStatus",
          userCount: { $sum: 1 },
          averageSpent: { $avg: "$totalSpent" },
          totalBookings: { $sum: "$bookingCount" },
        },
      },
    ]);

    // 4. Peak Hours Analysis
    const peakHoursAnalysis = await Booking.aggregate([
      {
        $group: {
          _id: {
            hour: { $substr: ["$time", 0, 2] },
            field: "$field",
          },
          bookingCount: { $sum: 1 },
          averagePrice: { $avg: "$price" },
          totalRevenue: { $sum: "$price" },
        },
      },
      {
        $sort: { bookingCount: -1 },
      },
      {
        $group: {
          _id: "$_id.field",
          peakHours: {
            $push: {
              hour: "$_id.hour",
              bookingCount: "$bookingCount",
              averagePrice: "$averagePrice",
              totalRevenue: "$totalRevenue",
            },
          },
        },
      },
    ]);

    res.status(200).json({
      fieldUsageStats,
      paymentTrends: paymentTrends[0],
      userEngagement,
      peakHoursAnalysis,
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ error: "Error generating analytics" });
  }
};

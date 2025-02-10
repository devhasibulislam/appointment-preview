require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { GraphQLClient, gql } = require("graphql-request");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

// GraphQL API Endpoint
const client = new GraphQLClient(process.env.GRAPHQL_API_URL);

// Routes
app.get("/", (req, res) => {
  res.json({
    schedule: "http://localhost:5000/schedule",
    form: "http://localhost:5000/form",
    error: "http://localhost:5000/error",
  });
});

app.get("/schedule", async (req, res) => {
  const query = gql`
    query GetBooking($getBookingId: ID!) {
      getBooking(id: $getBookingId) {
        acknowledgement
        description
        statusCode
        message
        data {
          bookingPageIntro
          bookingPageTitle
          profileLogo
          selectSlotBookingCapacity
          howLongMeetingFor
          timetableAvailability {
            day
            timeSlots {
              _id
              startTime
              isBooked
            }
          }
        }
      }
    }
  `;

  try {
    // const variables = { getBookingId: "67911408f8a7d4ee3ef101a6" };
    const variables = { getBookingId: "67aa2dced9d6f2ab41fcb8c7" };
    const jsonData = await client.request(query, variables);
    const bookingData = jsonData.getBooking.data;

    res.render("schedule", { bookingData });
  } catch (error) {
    console.error("GraphQL Error:", error);
    res.render("error", error);
  }
});

app.get("/form", async (req, res) => {
  const bookingId = req.query.bookingId || "67911408f8a7d4ee3ef101a6"; // Default ID

  const query = gql`
    query GetBooking($getBookingId: ID!) {
      getBooking(id: $getBookingId) {
        acknowledgement
        description
        statusCode
        message
        data {
          _id
          bookingPageIntro
          bookingPageTitle
          profileLogo
          selectSlotBookingCapacity
          howLongMeetingFor
          bookingPageLink
          bookingQuestion {
            _id
            label
            shortCode
            type
            required
            defaultValue
            options {
              option
              fields
            }
            placeholder
            min
            max
            size
          }
        }
      }
    }
  `;

  try {
    const variables = { getBookingId: bookingId };
    const jsonData = await client.request(query, variables);
    const bookingData = jsonData.getBooking.data;

    // Extract slots from the query parameters
    const slots = req.query.slots ? req.query.slots.split(",") : [];

    // Add the slots as timeSlotIds in bookingData
    bookingData.timeSlotIds = slots;

    console.log(bookingData);

    res.render("form", { bookingData }); // Pass data to EJS
  } catch (error) {
    console.error("GraphQL Error:", error);
    res.render("error", { error });
  }
});

app.get("/error", (req, res) => {
  res.render("error");
});

// Handle error
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render("error", { error: err });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

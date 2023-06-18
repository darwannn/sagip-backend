import { useState, useEffect } from "react";
import { Page, Text, View, Document } from "@react-pdf/renderer";
import { request } from "../../utils/axios";

const PDFDocument = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchEmergencyFacility = async () => {
      try {
        const data = await request("/hazard-report/", "GET");

        setData(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchEmergencyFacility();
  }, []); // Add an empty dependency array to useEffect to fetch data only once

  return (
    <Document>
      <Page size="A4">
        <View style={{ flexDirection: "row", backgroundColor: "#E4E4E4" }}>
          <View
            style={{
              margin: 10,
              padding: 10,
              flexGrow: 1,
              border: "1px solid black",
            }}
          >
            {/* Table header */}
            <View
              style={{
                flexDirection: "row",
                borderBottom: "1px solid black",
                alignItems: "center",
                padding: 4,
              }}
            >
              <Text style={{ width: "5%", textAlign: "center" }}>#</Text>
              <Text style={{ width: "15%" }}>Name</Text>
              <Text style={{ width: "15%" }}>Contact Number</Text>
              <Text style={{ width: "15%" }}>Address</Text>
              <Text style={{ width: "15%" }}>Category</Text>
              <Text style={{ width: "15%" }}>Longitude</Text>
              <Text style={{ width: "15%" }}>Latitude</Text>
              <Text style={{ width: "15%" }}>Location</Text>
              <Text style={{ width: "15%" }}>Description</Text>
            </View>

            {/* Table rows */}
            {data.map((row, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  borderBottom: "1px solid black",
                  alignItems: "center",
                  padding: 4,
                }}
              >
                <Text style={{ width: "5%", textAlign: "center" }}>
                  {index + 1}
                </Text>
                <Text style={{ width: "15%" }}>{row.name}</Text>
                <Text style={{ width: "15%" }}>{row.contactNumber}</Text>
                <Text style={{ width: "15%" }}>{row.address}</Text>
                <Text style={{ width: "15%" }}>{row.category}</Text>
                <Text style={{ width: "15%" }}>{row.longitude}</Text>
                <Text style={{ width: "15%" }}>{row.latitude}</Text>
                <Text style={{ width: "15%" }}>{row.location}</Text>
                <Text style={{ width: "15%" }}>{row.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default PDFDocument;

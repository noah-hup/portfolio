const DATA = {
  resume: [
    {
      type: "experience",
      title: "Student Research Assistant",
      org: "Department of Psychology and Movement Science",
      location: "Paderborn, North Rhine-Westphalia, Germany",
      period: "June 2024 – Present",
      desc: "Maintenance and further development of a large-scale research software in Java. Conducting EEG measurements, including independent instruction and supervision of participants. Providing technical and organizational support for ongoing research projects.",
      tags: ["EEGLAB", "Java", "Typo3", "Python", "Research Support"]
    },
    {
      type: "education",
      title: "B.Ed. Computer Science & Physical Education",
      org: "Universität Paderborn",
      period: "2024 – Present",
      desc: "Bachelor of Education in Computer Science and Physical Education."
    },
    {
      type: "education",
      title: "Abitur",
      org: "Marienschule Lippstadt",
      period: "2024",
      desc: "Grade: 1.2"
    }
  ],

  projects: [
    {
      title: "8-Bit Ripple Carry",
      slug: "ripple-carry",
      period: "2026",
      type: "Hardware",
      desc: "An 8-bit ripple carry adder built from discrete logic gates.",
      tags: ["Digital Logic", "ESP32", "Combinational Circuits", "Embedded Web Server"],
      cover: "media/projects/adder/adder.jpg",

      /* Optional external links shown as buttons */
      links: [
        // { label: "GitHub", url: "https://github.com/..." },
        // { label: "Demo", url: "https://..." }
      ],

      /* Content blocks rendered on the project page.
         Supported types: text | image | gallery | video | stats | code | divider
      */
      content: [
        {
          type: "text",
          heading: "Overview",
          body: "This project implements an 8-bit ripple carry adder using discrete 74HC-series logic ICs mounted on a custom PCB. The carry signal propagates through each full-adder stage sequentially — simple, but illuminating as a study in propagation delay."
        },
        {
          type: "stats",
          items: [
            { value: "8", label: "Bits" },
            { value: "74HC", label: "Logic family" },
            { value: "~40ns", label: "Worst-case delay" }
          ]
        },
        {
          type: "image",
          src: "media/projects/adder/adder.jpg",
          caption: "Assembled PCB — top view",
          wide: false
        },
        {
          type: "gallery",
          images: [
            { src: "media/projects/adder/detail-1.jpg", caption: "Full-adder cell" },
            { src: "media/projects/adder/detail-2.jpg", caption: "Carry chain" },
            "media/projects/adder/detail-3.jpg"
          ]
        },
        {
          type: "video",
          src: "media/projects/adder/demo.mp4",
          caption: "Live addition demo",
          muted: true,
          loop: true,
          autoplay: true
        },
        {
          type: "video",
          embed: "https://www.youtube.com/embed/VIDEOID",
          caption: "Explanation walkthrough",
          wide: true
        },
        {
          type: "text",
          heading: "How it works",
          body: "Each bit position uses one full-adder: two XOR gates compute the sum, while AND/OR gates generate the carry-out. Because each stage waits for the previous carry, total latency grows linearly with bit width — hence 'ripple'."
        },
        {
          type: "code",
          label: "Verilog equivalent",
          code:
`module ripple_carry_adder #(parameter N = 8) (
  input  [N-1:0] a, b,
  input          cin,
  output [N-1:0] sum,
  output         cout
);
  wire [N:0] carry;
  assign carry[0] = cin;
  genvar i;
  generate
    for (i = 0; i < N; i = i + 1) begin : fa
      assign {carry[i+1], sum[i]} = a[i] + b[i] + carry[i];
    end
  endgenerate
  assign cout = carry[N];
endmodule`
        },
        {
          type: "divider"
        },
        {
          type: "text",
          heading: "What I learned",
          body: "Building this in hardware made propagation delay visceral in a way simulation never does. Measuring carry-chain latency with an oscilloscope and then cross-checking against the datasheet specs cemented the theory."
        }
      ]
    },

    {
      title: "CSV Comparison Tool",
      slug: "csv-comparison",
      period: "2026",
      type: "Software",
      desc: "A tool for comparing CSV files and identifying differences.",
      tags: ["Python", "Data Analysis", "File Processing"],
      cover: "media/projects/csv-comparison/full.jpg",

      links: [
         { label: "GitHub", url: "https://github.com/..." }
      ],

      content: [
        {
          type: "text",
          heading: "Overview",
          body: "A command-line Python utility that diffs two CSV files column-by-column, highlights added/removed/changed rows, and exports a colored HTML report."
        },
        {
          type: "image",
          src: "media/projects/csv-comparison/full.jpg",
          caption: "Output report example",
          wide: false
        },
        {
          type: "text",
          heading: "Usage",
          body: "Drop two CSVs into the tool and get an HTML report with every difference highlighted. Useful for catching data-pipeline regressions."
        }
      ]
    }
  ],

  about: {
    bio: "I'm Noah — a CS & PE student based in Paderborn, Germany. I build things at the intersection of hardware, software, and sport science.",
    photography: [

      { type: "group", label: "Rome" },
      { src: "media/photography/rome/02.webp", aspect: 2/3},
      {src: "media/photography/rome/01.webp", aspect: 2/3},
      {src: "media/photography/rome/06.webp", aspect: 16/9},
      {src: "media/photography/rome/03.webp", aspect: 3/2.723},
      

      { type: "group", label: "swan" },
      { src: "media/photography/swan/01.webp", aspect: 2/3},
      { src: "media/photography/swan/02.webp", aspect: 3/2},
      { src: "media/photography/swan/03.webp", aspect: 3/2.41},
      { src: "media/photography/swan/04.webp", aspect: 3/2.41},
      { src: "media/photography/swan/07.webp", aspect: 3/2},

      { type: "group", label: "garden" },
      { src: "media/photography/garden/03.webp", aspect: 3/2},
      { src: "media/photography/garden/04.webp", aspect: 3/2},      
      { src: "media/photography/garden/02.webp", aspect: 3/2},


      { type: "group", label: "snowy park" },
      { src: "media/photography/snowy-park/02.webp", aspect: 3/2},
      { src: "media/photography/snowy-park/05.webp", aspect: 3/2},
      { src: "media/photography/snowy-park/04.webp", aspect: 3/2},
      
      { type: "group", label: "golden snow" },
      { src: "media/photography/golden-snow/07.webp", aspect: 3/2},
      { src: "media/photography/golden-snow/06.webp", aspect: 3/2},
      { src: "media/photography/golden-snow/08.webp", aspect: 3/2},

    ]
  }
};

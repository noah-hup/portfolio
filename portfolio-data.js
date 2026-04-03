const DATA = {
  resume: [
    {
      type: "experience",
      title: "Student Research Assistant",
      org: "Department of Psychology and Movement Science",
      location: "Paderborn, Germany",
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
      desc: "8-bit adder built from logic gates with real-time visualization via embedded web interface.",
      tags: ["Digital Logic", "ESP32", "Circuit Design", "Embedded Web Server"],
      cover: "media/projects/ripple-carry/led.webp",
      
      links: [
        { label: "circuit", url: "/media/projects/ripple-carry/circuit.pdf" },
        { label: "code",  url: "/media/projects/ripple-carry/esp32-code.ino" }
      ],

  

      content: [
        {
          type: "text",
          heading: "Overview",
          body: "The adder is built from 40 digital ICs (16 XOR, 16 AND, 8 OR) arranged as eight cascaded full adders. All arithmetic operations are carried out directly in hardware using electrical signals. An ESP32 runs as a Wi-Fi access point and hosts a local web server to display inputs and outputs in real time. An onboard LCD shows the binary result. The system can be powered via USB-C or by battery for standalone use. It reliably adds two 8-bit numbers, producing results of up to 510."
        },
        {
          type: "stats",
          items: [
            { value: "8",     label: "Bits" },
            { value: "LCD",  label: "Output Display" },
            { value: "USB", label: "Power Source" },
            { value: "WiFi", label: "Access Point" }
          ]
        },
        {
          type: "text",
          heading: "Progress",
          body: "Early prototypes occupied multiple breadboards. Optimizing the layout and switching from push buttons to DIP switches reduced space usage and improved reliability."
        },
        {
        type: "gallery",
          images: [
            { src: "media/projects/ripple-carry/adder.webp", caption: "2 full adders" },
            { src: "media/projects/ripple-carry/website.webp", caption: "website" },
            { src: "media/projects/ripple-carry/dip.webp", caption: "dip switches" },

          ]
        },
      ]
    },

    //–––––––––––––––––––––––––––––––––-
    {
      title: "CSV Comparison Tool",
      slug: "csv-comparison",
      period: "2026",
      type: "Software",
      desc: "A Python-based tool for Jürgenhake Deutschland GmbH that compares unordered CSV files using composite keys and highlights differences for transparent reporting.",
      tags: ["Python", "Tkinter", "ReportLab"],
      cover: "media/projects/csv-comparison/full.webp",
      
      links: [
        { label: "Jürgenhake", url: "https://www.juergenhake.de" },
      ],

      content: [
        {
          type: "text",
          heading: "Problem",
          body: "The company required a tool to compare two CSV files and reliably detect differences. Since the data was not consistently ordered, a direct row-by-row comparison was not feasible, making a robust matching mechanism necessary."
        },
        {
          type: "text",
          heading: "Approach",
          body: "The system uses a composite key consisting of Product_ID, OPEN_QTY, ORDER_TYPE, and ORDER_ID to uniquely identify records across unordered CSV files. Differences are classified into four categories: new (green), modified (yellow), removed (red), and a special case where COMMIT_STAT is UNCOMMITTED while COMMIT_DATE is set (blue). The application monitors two directories (base and curr) and automatically loads the most recent files for comparison. Additionally, it supports Excel and PDF exports."
        },
        {
          type: "gallery",
          images: [
            { src: "media/projects/csv-comparison/pdf.webp", caption: "pdf report" },
            { src: "media/projects/csv-comparison/select.webp", caption: "select option" }
          ]
        },
      ]
    }
  ],

    //     /* VIDEO — local file */
    //     {
    //       type: "video",
    //       src: "media/projects/project-slug/demo.mp4",
    //       caption: "Live demo",    // optional
    //       muted: true,
    //       loop: true,
    //       autoplay: true,
    //       wide: false
    //     },
    //
    //     /* VIDEO — embedded iframe (YouTube / Vimeo / etc.) */
    //     {
    //       type: "video",
    //       embed: "https://www.youtube.com/embed/VIDEOID",
    //       caption: "Explanation walkthrough",   // optional
    //       wide: true
    //     },
    //
    //     /* CODE — syntax-highlighted code block */
    //     {
    //       type: "code",
    //       label: "filename.ext or language label",   // optional
    //      code:



  about: {
    photography: [

      { type: "group", label: "Rome" },
      { src: "media/photography/rome/02.webp", aspect: 2/3 },
      { src: "media/photography/rome/01.webp", aspect: 2/3 },
      { src: "media/photography/rome/06.webp", aspect: 16/9 },
      { src: "media/photography/rome/03.webp", aspect: 3/2.723 },

      { type: "group", label: "swan" },
      { src: "media/photography/swan/01.webp", aspect: 2/3 },
      { src: "media/photography/swan/02.webp", aspect: 3/2 },
      { src: "media/photography/swan/03.webp", aspect: 3/2.41 },
      { src: "media/photography/swan/04.webp", aspect: 3/2.41 },
      { src: "media/photography/swan/07.webp", aspect: 3/2 },

      { type: "group", label: "garden" },
      { src: "media/photography/garden/03.webp", aspect: 3/2 },
      { src: "media/photography/garden/04.webp", aspect: 3/2 },
      { src: "media/photography/garden/02.webp", aspect: 3/2 },

      { type: "group", label: "snowy park" },
      { src: "media/photography/snowy-park/02.webp", aspect: 3/2 },
      { src: "media/photography/snowy-park/05.webp", aspect: 3/2 },
      { src: "media/photography/snowy-park/04.webp", aspect: 3/2 },

      { type: "group", label: "golden snow" },
      { src: "media/photography/golden-snow/07.webp", aspect: 3/2 },
      { src: "media/photography/golden-snow/06.webp", aspect: 3/2 },
      { src: "media/photography/golden-snow/08.webp", aspect: 3/2 }

    ]
  }
};

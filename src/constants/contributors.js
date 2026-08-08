// The people behind EducationalBridge.
//
// HOW TO ADD A PHOTO
// ------------------
// 1. Drop the image into `public/contributors/` (e.g. public/contributors/akanksha.jpg).
//    Square images work best — the avatar crops to a circle.
// 2. Set `image` below to the public path, e.g. image: '/contributors/akanksha.jpg'.
// Leaving `image` as null is fine: the Avatar component falls back to the
// person's initials, so nobody renders as a broken image while we wait on a photo.
//
// `lead: true` marks the person who gets the feature card on the home page.
// Everyone else renders in the supporting grid, in array order.

export const contributors = [
    {
        name: 'Akanksha Kumari',
        role: 'Founder & Lead',
        lead: true,
        image: '/contributors/akanksha.jpg',
        headline: 'Software Development Analyst at Accenture',
        credentials: 'MTech, Data Science & Engineering — BITS Pilani',
        bio: 'Akanksha started EducationalBridge because she needed it and it did not exist. '
            + 'She prepared without the coaching classes, mock tests, and practice banks that most '
            + 'aspirants treat as a given, and she is building the platform so the next student in '
            + 'that position has somewhere to go. She sets the product direction and works across '
            + 'the platform, from the question bank to the interface.',
        focus: ['Product direction', 'Data engineering', 'Content'],
        links: [],
    },
    {
        name: 'Prakash Bhardwaj',
        role: 'Engineering',
        image: null,
        headline: 'Software Engineer II at Microsoft, previously Oracle',
        credentials: 'BTech, Computer Science — MANIT Bhopal',
        bio: 'Prakash works on distributed systems and brings the infrastructure discipline that '
            + 'keeps a question bank fast and dependable under load. He has solved over 2,500 '
            + 'algorithmic problems, competed at multiple ICPC regionals, and contributes to '
            + 'Apache Lucene and OpenSearch — which is exactly the background search and retrieval '
            + 'on this platform benefits from.',
        focus: ['Distributed systems', 'Backend', 'Search'],
        links: [
            { label: 'Codeforces', url: 'https://codeforces.com/profile/og_prakash' },
            { label: 'CodeChef', url: 'https://www.codechef.com/users/hsakarp' },
        ],
    },
    {
        name: 'Vikas Kumar Dhiraj',
        role: 'Outreach & Operations',
        image: null,
        headline: 'Associate Director, Planning & Development Department, Government of Bihar',
        credentials: 'MBA, Agribusiness Management — NIAM Jaipur',
        bio: 'Vikas spent a decade in public-sector banking before moving into state planning and '
            + 'development. He knows how programmes actually reach students in districts where '
            + 'private coaching never will, and he shapes how this platform gets into the hands of '
            + 'the people it was built for.',
        focus: ['Public sector', 'Outreach', 'Partnerships'],
        links: [],
    },
];

export default contributors;

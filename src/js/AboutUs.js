import React from 'react';
import '../App.css';
import { SocialIcon } from 'react-social-icons';
import EducationalBridgeHeader from './header/EducationalBridgeHeader';
import Badge from '../components/common/Badge';
import AdRail from '../components/common/AdRail';
import { typography } from '../constants/designTokens';

class AboutUs extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        return <div className="bg-gray-50 min-h-screen">
        <EducationalBridgeHeader/>
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-6 items-start">
        <AdRail />
        <div className="flex-1 min-w-0 max-w-3xl mx-auto flex flex-col gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
                <div className='flex flex-row items-center gap-2'>
                    <div className={typography.display + ' text-primary-700'}>
                        EducationalBridge
                    </div>
                    <Badge variant="warning">Beta</Badge>
                </div>
                <div className={typography.body + ' pt-4 leading-relaxed'}>
                    At EducationalBridge, we're building a peer to peer platform where content creators can create questions, test papers and exam mocks while
                    consumers of the content can solve the questions and papers.
                </div>
                <div className={typography.body + ' pt-3 leading-relaxed'}>
                    In our modern education system, we've been great at providing quality content to students across geographical locations. Thanks to increased internet adoption, students in
                    remote parts of Spain can learn English from creators like Vanessa on <a className="text-primary-600 hover:underline" href="https://www.youtube.com/channel/UCxJGMJbjokfnr2-s4_RXPxQ">YouTube</a> while
                    learning German in India is just a few megabytes away.
                </div>
                <div className={typography.body + ' pt-3 leading-relaxed'}>
                    We believe learning is a continuous process of upskilling and self-evaluation. There are many platforms that help content creators amplify learning, but few that
                    let content consumers self-evaluate. A teacher in the USA can teach English to thousands of students at once, but has little tooling
                    to evaluate their learning &mdash; they can replicate the classroom online but not the examination room. EducationalBridge envisions a peer to peer platform where
                    any content creator can create questions and papers, while consumers can solve them and get the analysis that helps them improve.
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
                <div className={typography.h1 + ' text-primary-700 pb-4'}>
                    From the founder
                </div>
                <div className='flex flex-col sm:flex-row gap-4 items-start'>
                    <div className="flex justify-center shrink-0">
                        <img src="./../../../correct_sign.png" alt="Founder portrait" width="100" height="100" className="rounded-full"/>
                    </div>
                    <div className='flex flex-col gap-3'>
                        <div className={typography.body + ' leading-relaxed'}>
                            I graduated in 2018 from the National Institute of Technology (NIT), Patna and have been working as a software developer since. Coming from a remote village
                            in Bihar, I've always had a scarcity of the right tools and infrastructure for productivity as a student and teacher. EducationalBridge is an initiative
                            I'm taking to build a product that gives quality analysis of our strengths and areas for improvement. Let's learn together
                            and grow together.
                        </div>
                        <div className={typography.body}>
                            If you've anything to share with us, feel free to reach out on <SocialIcon url="https://www.linkedin.com/in/krishna-murari-208615ba/" style={{ height: 28, width: 28 }}/> or the contacts below.
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
                <div className={typography.h1 + ' text-primary-700 pb-4'}>
                    Contact
                </div>
                <div className='flex flex-col gap-2'>
                    <div className={typography.body}>
                        Phone (USA): (+1) 917-576-6318
                    </div>
                    <div className={typography.body}>
                        Phone (India, WhatsApp only): (+91) 7488-093-798
                    </div>
                    <div className={typography.body}>
                        Mailing Address: 3FL, 69 Graham Street, Jersey City, New Jersey, USA (07307)
                    </div>
                </div>
            </div>
        </div>
        <AdRail />
        </div>
    </div>
    }

}

export default AboutUs;

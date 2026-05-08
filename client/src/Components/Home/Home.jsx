"use client"

import { useState, useEffect, useMemo } from "react"
import { useSelector } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  Users,
  Shield,
  Bell,
  Globe,
  Upload,
  Search,
  CheckCircle,
  Star,
  ArrowRight,
  Play,
  Quote,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

// ✅ Adjust the import path if your folder structure is different
import homeData from "../../json/home.json"

const HomePage = () => {
  const currentLanguage = useSelector((state) => state?.language?.currentLanguage || "en")

  const t = useMemo(() => {
    return homeData?.[currentLanguage] || homeData?.en
  }, [currentLanguage])

  const [openFAQ, setOpenFAQ] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  // Only URLs stay here. Titles/subtitles will come from i18n JSON.
  const carouselImageUrls = useMemo(
    () => [
      "https://images.pexels.com/photos/5668473/pexels-photo-5668473.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/5669602/pexels-photo-5669602.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/5668882/pexels-photo-5668882.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/5669619/pexels-photo-5669619.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    []
  )

  const carouselSlides = t?.carousel?.slides || []
  const carouselImages = useMemo(() => {
    // Make sure we don’t crash if slides count and images count differ
    return carouselImageUrls.map((url, index) => ({
      url,
      title: carouselSlides?.[index]?.title || "",
      subtitle: carouselSlides?.[index]?.subtitle || "",
    }))
  }, [carouselImageUrls, carouselSlides])

  useEffect(() => {
    if (!carouselImages.length) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [carouselImages.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  // Icons are static, text will come from JSON (features.items)
  const featureIcons = [
    <Upload className="w-8 h-8" key="Upload" />,
    <Search className="w-8 h-8" key="Search" />,
    <Users className="w-8 h-8" key="Users" />,
    <FileText className="w-8 h-8" key="FileText" />,
    <CheckCircle className="w-8 h-8" key="CheckCircle" />,
    <Bell className="w-8 h-8" key="Bell" />,
    <Globe className="w-8 h-8" key="Globe" />,
    <Shield className="w-8 h-8" key="Shield" />,
  ]

  const features = useMemo(() => {
    const items = t?.features?.items || []
    return items.map((item, idx) => ({
      icon: featureIcons[idx] || <FileText className="w-8 h-8" key={`fallback-${idx}`} />,
      title: item?.title || "",
      description: item?.desc || "",
    }))
  }, [t, featureIcons])

  // These are demo data; only section headings/buttons are translated from JSON.
  const lawyers = [
    {
      name: "Sarah Ahmed",
      specialty: "Family Law",
      experience: "8 years",
      rating: 4.9,
      cases: 150,
      image: "https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      name: "Dr. Rahman Khan",
      specialty: "Property Law",
      experience: "12 years",
      rating: 4.8,
      cases: 200,
      image: "https://images.pexels.com/photos/5668473/pexels-photo-5668473.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      name: "Maria Rodriguez",
      specialty: "Immigration Law",
      experience: "6 years",
      rating: 4.9,
      cases: 120,
      image: "https://images.pexels.com/photos/5668882/pexels-photo-5668882.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
  ]

  const testimonials = [
    {
      name: "Fatima Hassan",
      case: "Property Dispute",
      text: "The platform helped me find an excellent lawyer who resolved my property dispute efficiently. The process was transparent and I was updated at every step.",
      rating: 5,
    },
    {
      name: "Ahmed Ali",
      case: "Family Law",
      text: "I received free legal aid for my family matter. The lawyer was professional and the multi-language support made everything easier to understand.",
      rating: 5,
    },
    {
      name: "Priya Sharma",
      case: "Document Verification",
      text: "The document verification system saved me from a potential fraud. The technology is impressive and gives peace of mind.",
      rating: 5,
    },
  ]

  const faqs = [
    {
      question: "How does the lawyer matching system work?",
      answer:
        "Our AI-powered system analyzes your case details, location, and legal needs to match you with qualified volunteer lawyers who specialize in your specific area of law. The matching process typically takes 24-48 hours.",
    },
    {
      question: "Is the legal aid service really free?",
      answer:
        "Yes, our platform connects you with volunteer lawyers who provide pro bono services. There are no fees for using our matching service, accessing legal resources, or basic consultations. Some complex cases may require additional services that could incur costs.",
    },
    {
      question: "What types of legal cases do you handle?",
      answer:
        "We handle a wide range of legal matters including family law, property disputes, immigration issues, employment law, civil rights cases, and document verification. Our network includes lawyers specializing in various areas of law.",
    },
    {
      question: "How secure is my personal information?",
      answer:
        "We use bank-level encryption and follow strict privacy protocols. Your personal information is never shared without your consent, and our document verification system uses blockchain technology for maximum security and transparency.",
    },
    {
      question: "Can I track the progress of my case?",
      answer:
        "Our platform provides real-time case tracking with updates on deadlines, milestones, and important developments. You'll receive notifications via SMS and email to keep you informed throughout the process.",
    },
    {
      question: "What languages are supported on the platform?",
      answer:
        "Our platform supports multiple languages including English, Bangla, Spanish, and Arabic. We're continuously adding more languages to serve diverse communities and ensure accessibility for everyone.",
    },
    {
      question: "How do I verify if a lawyer is qualified?",
      answer:
        "All lawyers on our platform go through a rigorous verification process. You can view their credentials, bar association membership, areas of expertise, client reviews, and success rates on their profiles.",
    },
    {
      question: "What if I'm not satisfied with the legal service?",
      answer:
        "We have a quality assurance process in place. If you're not satisfied, you can request a different lawyer or escalate the issue to our support team. We're committed to ensuring you receive quality legal assistance.",
    },
  ]

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[85vh] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <div
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${carouselImages[currentSlide]?.url || ""})` }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              key={`content-${currentSlide}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                <span className="text-cyan-400">{t?.carousel?.platformName || "LawLinkBD"}</span>
              </h1>
              <h2 className="text-2xl md:text-4xl font-semibold text-white mb-4">
                {carouselImages[currentSlide]?.title || ""}
              </h2>
              <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed">
                {carouselImages[currentSlide]?.subtitle || ""}
              </p>
              <div className="flex flex-col sm:flex-row mb-10 gap-4 justify-center">
                <motion.button
                  className="bg-cyan-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t?.carousel?.buttons?.submitCase || "Submit Your Case"} <ArrowRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-5 h-5" /> {t?.carousel?.buttons?.watchDemo || "Watch Demo"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute inset-y-0 left-4 flex items-center z-20">
          <motion.button
            onClick={prevSlide}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full backdrop-blur-sm transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="absolute inset-y-0 right-4 flex items-center z-20">
          <motion.button
            onClick={nextSlide}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full backdrop-blur-sm transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4 z-20">
          {carouselImages.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => goToSlide(index)}
              className={`text-3xl font-bold transition-all duration-300 ${
                currentSlide === index ? "text-cyan-400" : "text-white text-opacity-60"
              }`}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              animate={{
                scale: currentSlide === index ? 1.1 : 1,
                opacity: currentSlide === index ? 1 : 0.6,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {currentSlide === index ? <span className="inline-block w-4 h-4 bg-cyan-400 rounded-full"></span> : "•"}
            </motion.button>
          ))}
        </div>

        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex items-center gap-8 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-8 py-4">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-2xl font-bold text-cyan-400">10,000+</div>
              <div className="text-sm text-gray-200">{t?.carousel?.stats?.casesResolved || "Cases Resolved"}</div>
            </motion.div>
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="text-2xl font-bold text-cyan-400">500+</div>
              <div className="text-sm text-gray-200">{t?.carousel?.stats?.volunteerLawyers || "Volunteer Lawyers"}</div>
            </motion.div>
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="text-2xl font-bold text-cyan-400">95%</div>
              <div className="text-sm text-gray-200">{t?.carousel?.stats?.successRate || "Success Rate"}</div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t?.features?.sectionTitle || "Comprehensive Legal Aid Platform"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t?.features?.sectionDesc || ""}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-cyan-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="text-cyan-600 mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t?.lawyers?.sectionTitle || "Meet Our Volunteer Lawyers"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t?.lawyers?.sectionDesc || ""}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {lawyers.map((lawyer, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-cyan-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="text-center mb-6">
                  <img
                    src={lawyer.image || "/placeholder.svg"}
                    alt={lawyer.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-cyan-200"
                  />
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{lawyer.name}</h3>
                  <p className="text-cyan-600 font-medium">{lawyer.specialty}</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Experience:</span>
                    <span className="font-medium text-gray-900">{lawyer.experience}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Cases Handled:</span>
                    <span className="font-medium text-gray-900">{lawyer.cases}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Rating:</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium text-gray-900">{lawyer.rating}</span>
                    </div>
                  </div>
                </div>

                <motion.button
                  className="w-full bg-cyan-600 text-white py-3 rounded-lg font-semibold hover:bg-cyan-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t?.lawyers?.button || "Connect Now"}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t?.testimonials?.sectionTitle || "Success Stories"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t?.testimonials?.sectionDesc || ""}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg border border-gray-200"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Quote className="w-8 h-8 text-cyan-600 mb-4" />
                <p className="text-gray-900 mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.case}</p>
                  </div>
                  <div className="flex">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t?.faqs?.sectionTitle || "Frequently Asked Questions"}
            </h2>
            <p className="text-xl text-gray-600">{t?.faqs?.sectionDesc || ""}</p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <motion.button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  whileHover={{ backgroundColor: "rgb(249 250 251)" }}
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  <motion.div animate={{ rotate: openFAQ === index ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    {openFAQ === index ? (
                      <Minus className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                    ) : (
                      <Plus className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                    )}
                  </motion.div>
                </motion.button>
                <motion.div
                  initial={false}
                  animate={{ height: openFAQ === index ? "auto" : 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <motion.button
              className="bg-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-cyan-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t?.faqs?.contactBtn || "Contact Support"}
            </motion.button>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-cyan-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {t?.callToAction?.sectionTitle || "Ready to Get Legal Help?"}
            </h2>
            <p className="text-xl text-cyan-100 mb-8 leading-relaxed">{t?.callToAction?.sectionDesc || ""}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                className="bg-amber-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-amber-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t?.callToAction?.buttons?.submitCase || "Submit Your Case"}
              </motion.button>
              <motion.button
                className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-cyan-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t?.callToAction?.buttons?.browseLawyers || "Browse Lawyers"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { FileText, Download, Eye, Search, BookOpen, Scale, Shield, Home, Users, Briefcase } from "lucide-react"

const ResourcesPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const resources = [
    {
      id: 1,
      title: "Divorce Petition Template",
      category: "Family Law",
      type: "Template",
      description: "Complete divorce petition form with instructions for filing in family court.",
      downloads: 1250,
      icon: <FileText className="w-6 h-6" />,
      size: "2.3 MB",
      format: "PDF",
    },
    {
      id: 2,
      title: "Property Transfer Guide",
      category: "Property Law",
      type: "Guide",
      description: "Step-by-step guide for legal property transfers and required documentation.",
      downloads: 890,
      icon: <Home className="w-6 h-6" />,
      size: "1.8 MB",
      format: "PDF",
    },
    {
      id: 3,
      title: "Immigration Application Checklist",
      category: "Immigration Law",
      type: "Checklist",
      description: "Comprehensive checklist for various immigration applications and requirements.",
      downloads: 2100,
      icon: <Shield className="w-6 h-6" />,
      size: "850 KB",
      format: "PDF",
    },
    {
      id: 4,
      title: "Employment Contract Template",
      category: "Employment Law",
      type: "Template",
      description: "Standard employment contract template with customizable clauses.",
      downloads: 1560,
      icon: <Briefcase className="w-6 h-6" />,
      size: "1.2 MB",
      format: "DOCX",
    },
    {
      id: 5,
      title: "Criminal Defense Rights",
      category: "Criminal Law",
      type: "Guide",
      description: "Know your rights when facing criminal charges - a comprehensive guide.",
      downloads: 980,
      icon: <Scale className="w-6 h-6" />,
      size: "2.1 MB",
      format: "PDF",
    },
    {
      id: 6,
      title: "Small Business Legal Checklist",
      category: "Business Law",
      type: "Checklist",
      description: "Essential legal requirements for starting and running a small business.",
      downloads: 1340,
      icon: <Users className="w-6 h-6" />,
      size: "1.5 MB",
      format: "PDF",
    },
    {
      id: 7,
      title: "Tenant Rights Handbook",
      category: "Property Law",
      type: "Handbook",
      description: "Complete guide to tenant rights, responsibilities, and dispute resolution.",
      downloads: 1780,
      icon: <BookOpen className="w-6 h-6" />,
      size: "3.2 MB",
      format: "PDF",
    },
    {
      id: 8,
      title: "Child Custody Agreement Template",
      category: "Family Law",
      type: "Template",
      description: "Customizable child custody agreement template for divorced parents.",
      downloads: 1120,
      icon: <FileText className="w-6 h-6" />,
      size: "1.9 MB",
      format: "DOCX",
    },
  ]

  const categories = [
    "All",
    "Family Law",
    "Property Law",
    "Immigration Law",
    "Employment Law",
    "Criminal Law",
    "Business Law",
  ]

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || resource.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Legal Resource Library</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access free legal documents, templates, guides, and resources to help you understand your rights and
            navigate legal processes.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredResources.length} of {resources.length} resources
          </p>
        </div>

        {/* Resources Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource, index) => (
            <motion.div
              key={resource.id}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-cyan-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="text-cyan-600 bg-cyan-50 p-3 rounded-lg">{resource.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{resource.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-cyan-50 text-cyan-600 text-xs rounded-full">{resource.category}</span>
                    <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs rounded-full">{resource.type}</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-4">{resource.description}</p>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>
                  {resource.size} • {resource.format}
                </span>
                <span>{resource.downloads.toLocaleString()} downloads</span>
              </div>

              <div className="flex gap-2">
                <motion.button
                  className="flex-1 bg-cyan-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4" />
                  Download
                </motion.button>
                <motion.button
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Eye className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No resources found matching your criteria.</p>
            <p className="text-gray-500">Try adjusting your search or category filter.</p>
          </div>
        )}

        {/* Popular Categories */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Popular Categories</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(1).map((category, index) => (
              <motion.button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="p-4 bg-white rounded-lg border border-gray-200 hover:border-cyan-200 hover:shadow-lg transition-all duration-300 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -3 }}
              >
                <div className="text-cyan-600 mb-2">
                  <Scale className="w-6 h-6 mx-auto" />
                </div>
                <span className="text-sm font-medium text-gray-900">{category}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ResourcesPage

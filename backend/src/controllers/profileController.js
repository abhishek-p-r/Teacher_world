const TeacherProfile = require("../models/TeacherProfile")
const InstitutionProfile = require("../models/InstitutionProfile")
const User = require("../models/User")

exports.getTeacherProfile = async (req, res) => {
  try {
    const profile = await TeacherProfile.findOne({ userId: req.user.userId })
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" })
    }

    // Get application counts
    const Application = require("../models/Application")
    const appliedJobsCount = await Application.countDocuments({ $or: [{ teacherId: profile._id }, { teacherId: req.user.userId }] })
    const shortlistedCount = await Application.countDocuments({ $or: [{ teacherId: profile._id }, { teacherId: req.user.userId }], status: "shortlisted" })
    const hiredCount = await Application.countDocuments({ $or: [{ teacherId: profile._id }, { teacherId: req.user.userId }], status: "accepted" })

    // For now, recommended jobs count can be a placeholder or calculated based on some logic
    // You can implement recommendation logic later
    const recommendedJobsCount = 0 // Placeholder

    const profileWithStats = {
      ...profile.toObject(),
      appliedJobsCount,
      shortlistedCount,
      hiredCount,
      recommendedJobsCount
    }

    res.json(profileWithStats)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getTeacherProfileById = async (req, res) => {
  try {
    const { teacherId } = req.params
    const profile = await TeacherProfile.findOne({ userId: teacherId })
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" })
    }

    // Get application counts
    const Application = require("../models/Application")
    const appliedJobsCount = await Application.countDocuments({ $or: [{ teacherId: profile._id }, { teacherId: teacherId }] })
    const shortlistedCount = await Application.countDocuments({ $or: [{ teacherId: profile._id }, { teacherId: teacherId }], status: "shortlisted" })
    const hiredCount = await Application.countDocuments({ $or: [{ teacherId: profile._id }, { teacherId: teacherId }], status: "accepted" })

    const profileWithStats = {
      ...profile.toObject(),
      appliedJobsCount,
      shortlistedCount,
      hiredCount
    }

    res.json(profileWithStats)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.updateTeacherProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      bio,
      experience,
      subjects,
      classesLevel,
      specializations,
      skills,
      degrees,
      certificates,
      expectedSalary,
      jobType,
      preferredLocations,
      remoteAvailable,
      readyToRelocate,
      availability,
      currentAddress,
      preferredShifts,
      city,
      state,
      country,
    } = req.body

    let profile = await TeacherProfile.findOne({ userId: req.user.userId })
    if (!profile) {
      profile = new TeacherProfile({ userId: req.user.userId })
    }

    profile.name = name || profile.name
    profile.email = email || profile.email
    profile.phone = phone || profile.phone
    profile.bio = bio || profile.bio
    // Handle experience field - ensure it's a number or null
    if (experience !== undefined && experience !== null && experience !== "") {
      const expNum = parseFloat(experience)
      profile.experience = isNaN(expNum) ? null : expNum
    }
    profile.subjects = Array.isArray(subjects) ? subjects : profile.subjects
    profile.classesLevel = Array.isArray(classesLevel) ? classesLevel : profile.classesLevel
    profile.specializations = Array.isArray(specializations) ? specializations : profile.specializations
    profile.skills = Array.isArray(skills) ? skills : profile.skills
    profile.degrees = Array.isArray(degrees) ? degrees : profile.degrees
    profile.certificates = Array.isArray(certificates) ? certificates : profile.certificates
    profile.expectedSalary = expectedSalary || profile.expectedSalary
    profile.jobType = Array.isArray(jobType) ? jobType : profile.jobType
    profile.preferredLocations = Array.isArray(preferredLocations) ? preferredLocations : profile.preferredLocations
    profile.remoteAvailable = remoteAvailable !== undefined ? remoteAvailable : profile.remoteAvailable
    profile.readyToRelocate = readyToRelocate !== undefined ? readyToRelocate : profile.readyToRelocate
    profile.availability = availability || profile.availability
    profile.currentAddress = currentAddress || profile.currentAddress
    profile.preferredShifts = Array.isArray(preferredShifts) ? preferredShifts : profile.preferredShifts
    profile.city = city || profile.city
    profile.state = state || profile.state
    profile.country = country || profile.country
    profile.updatedAt = new Date()

    if (req.files) {
      if (req.files.resume && req.files.resume[0]) {
        profile.resumeUrl = `/uploads/resumes/${req.files.resume[0].filename}`
      }
      if (req.files.marksCard && req.files.marksCard[0]) {
        profile.marksCardUrl = `/uploads/marksCards/${req.files.marksCard[0].filename}`
      }
    }

    const savedProfile = await profile.save()
    res.json({ message: "Profile updated successfully", profile: savedProfile })
  } catch (error) {
    console.error("[PROFILE] Update error:", error.message)
    res.status(500).json({ message: "Failed to update profile: " + error.message })
  }
}

exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" })
    }

    let profile = await TeacherProfile.findOne({ userId: req.user.userId })
    if (!profile) {
      profile = new TeacherProfile({ userId: req.user.userId })
    }

    const photoUrl = `/uploads/photos/${req.file.filename}`
    profile.photo = photoUrl
    await profile.save()

    res.json({ message: "Photo uploaded successfully", photoUrl, profile })
  } catch (error) {
    res.status(500).json({ message: "Failed to upload photo: " + error.message })
  }
}

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" })
    }

    let profile = await TeacherProfile.findOne({ userId: req.user.userId })
    if (!profile) {
      profile = new TeacherProfile({ userId: req.user.userId })
    }

    const fileUrl = `/uploads/resumes/${req.file.filename}`
    profile.resumeUrl = fileUrl
    await profile.save()

    res.json({ message: "Resume uploaded successfully", resumeUrl: fileUrl, profile })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.uploadMarksCard = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" })
    }

    const { marksType } = req.body

    let profile = await TeacherProfile.findOne({ userId: req.user.userId })
    if (!profile) {
      profile = new TeacherProfile({ userId: req.user.userId })
    }

  const fileUrl = `/uploads/marksCards/${req.file.filename}`
    profile.marksCards.push({
      type: marksType || "Other",
      url: fileUrl,
    })

    // Also keep legacy marksCardUrl for backward compatibility
  profile.marksCardUrl = fileUrl

    await profile.save()

  res.json({ message: "Marks card uploaded successfully", marksCardUrl: fileUrl, profile })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.uploadCertificate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" })
    }

    let profile = await TeacherProfile.findOne({ userId: req.user.userId })
    if (!profile) {
      profile = new TeacherProfile({ userId: req.user.userId })
    }

    const fileUrl = `/uploads/certificates/${req.file.filename}`
    profile.certificateUrls.push(fileUrl)
    await profile.save()

    res.json({ message: "Certificate uploaded", fileUrl, profile })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.addEducation = async (req, res) => {
  try {
    const { schoolName, degree, fieldOfStudy, startDate, endDate, grade, description } = req.body

    let profile = await TeacherProfile.findOne({ userId: req.user.userId })
    if (!profile) {
      profile = new TeacherProfile({ userId: req.user.userId })
    }

    if (!profile.education) {
      profile.education = []
    }

    profile.education.push({
      schoolName,
      degree,
      fieldOfStudy,
      startDate,
      endDate,
      grade,
      description,
      addedAt: new Date(),
    })

    const updatedProfile = await profile.save()
    res.json({ message: "Education added successfully", profile: updatedProfile })
  } catch (error) {
    console.error("[PROFILE] Add education error:", error.message)
    res.status(500).json({ message: "Failed to add education: " + error.message })
  }
}

exports.getInstitutionProfile = async (req, res) => {
  try {
    const profile = await InstitutionProfile.findOne({ userId: req.user.userId })
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" })
    }

    // Get job statistics
    const Job = require("../models/Job")
    const totalJobs = await Job.countDocuments({ $or: [{ institutionId: profile._id }, { institutionId: req.user.userId }] })
    const activeJobs = await Job.countDocuments({ $or: [{ institutionId: profile._id }, { institutionId: req.user.userId }], status: "active" })

    const profileWithStats = {
      ...profile.toObject(),
      totalJobs,
      activeJobs
    }

    res.json(profileWithStats)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.uploadInstitutionPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" })
    }

    let profile = await InstitutionProfile.findOne({ userId: req.user.userId })
    if (!profile) {
      profile = new InstitutionProfile({ userId: req.user.userId })
    }

    const photoUrl = `/uploads/institution-photos/${req.file.filename}`
    profile.photo = photoUrl
    await profile.save()

    res.json({ message: "Photo uploaded successfully", photoUrl, profile })
  } catch (error) {
    console.error("[PROFILE] Institution photo upload error:", error.message)
    res.status(500).json({ message: "Failed to upload photo: " + error.message })
  }
}

exports.updateInstitutionProfile = async (req, res) => {
  try {
    const {
      institutionName,
      phoneNumber,
      address,
      city,
      state,
      country,
      type,
      website,
      description,
      registrationNumber,
    } = req.body

    if (!institutionName || institutionName.trim() === "") {
      return res.status(400).json({ message: "Institution name is required" })
    }

    let profile = await InstitutionProfile.findOne({ userId: req.user.userId })
    if (!profile) {
      profile = new InstitutionProfile({ userId: req.user.userId })
    }

    Object.assign(profile, {
      institutionName,
      phoneNumber,
      address,
      city,
      state,
      country,
      type,
      website,
      description,
      registrationNumber,
      updatedAt: new Date(),
    })

    await profile.save()
    res.json({ message: "Profile updated successfully", profile })
  } catch (error) {
    console.error("[PROFILE] Institution update error:", error.message)
    res.status(500).json({ message: "Failed to update profile: " + error.message })
  }
}

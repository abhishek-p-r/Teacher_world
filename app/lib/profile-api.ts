import { apiClient } from "./api-client"

export interface TeacherProfile {
  _id?: string
  userId: string
  name?: string
  email?: string
  phone?: string
  photo?: string
  bio?: string
  experience?: number
  subjects?: string[]
  classesLevel?: string[]
  specializations?: string[]
  skills?: string[]
  degrees?: Array<{
    degree: string
    specialization: string
    institution: string
    year: number
  }>
  certificates?: Array<{
    name: string
    year: number
  }>
  resumeUrl?: string
  marksCardUrl?: string
  certificateUrls?: string[]
  expectedSalary?: string
  jobType?: string[]
  preferredLocations?: string[]
  remoteAvailable?: boolean
  readyToRelocate?: boolean
  availability?: string
  currentAddress?: string
  preferredShifts?: string[]
  city?: string
  state?: string
  country?: string
  createdAt?: string
  updatedAt?: string
}

export interface InstitutionProfile {
  _id?: string
  userId: string
  institutionName: string
  registrationNumber?: string
  phoneNumber?: string
  photo?: string
  description?: string
  address?: string
  city?: string
  state?: string
  country?: string
  type?: "school" | "college" | "university" | "coaching"
  established?: number
  website?: string
  verified?: boolean
  verificationDocs?: string[]
  createdAt?: string
  updatedAt?: string
}

export const profileApi = {
  async getTeacherProfile() {
    return apiClient.get<TeacherProfile>("/profile/teacher")
  },

  async updateTeacherProfile(data: Partial<TeacherProfile>) {
    return apiClient.put<TeacherProfile>("/profile/teacher", data)
  },

  async uploadTeacherPhoto(file: File) {
    const formData = new FormData()
    formData.append("photo", file)

    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://teacher-world.onrender.com/api"}/profile/teacher/photo`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Upload failed")
      }

      return { status: response.status, data }
    } catch (error) {
      return { status: 500, error: error instanceof Error ? error.message : "Upload failed" }
    }
  },

  async getInstitutionProfile() {
    return apiClient.get<InstitutionProfile>("/profile/institution")
  },

  async updateInstitutionProfile(data: Partial<InstitutionProfile>) {
    return apiClient.put<InstitutionProfile>("/profile/institution", data)
  },

  async uploadInstitutionPhoto(file: File) {
    const formData = new FormData()
    formData.append("photo", file)

    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://teacher-world.onrender.com/api"}/profile/institution/photo`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Upload failed")
      }

      return { status: response.status, data }
    } catch (error) {
      return { status: 500, error: error instanceof Error ? error.message : "Upload failed" }
    }
  },
}

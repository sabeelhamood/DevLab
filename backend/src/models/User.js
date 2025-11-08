import { supabase, getSupabaseTables } from '../config/database.js'

const { userProfiles } = getSupabaseTables()

export class UserProfileModel {
  // Create a new user profile
  static async create(userData) {
    const { data, error } = await supabase
      .from(userProfiles)
      .insert([userData])
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Get user profile by ID
  static async findById(userId) {
    const { data, error } = await supabase
      .from(userProfiles)
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  }

  // Get user profile by email
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from(userProfiles)
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) throw error
    return data
  }

  // Update user profile
  static async update(userId, updateData) {
    const { data, error } = await supabase
      .from(userProfiles)
      .update(updateData)
      .eq('user_id', userId)
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Delete user profile
  static async delete(userId) {
    const { error } = await supabase
      .from(userProfiles)
      .delete()
      .eq('user_id', userId)
    
    if (error) throw error
    return true
  }

  // Get all user profiles with pagination
  static async findAll(page = 1, limit = 10) {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from(userProfiles)
      .select('*', { count: 'exact' })
      .range(from, to)
    
    if (error) throw error
    return { data, count }
  }

  // Get users by organization
  static async findByOrganization(organizationId) {
    const { data, error } = await supabase
      .from(userProfiles)
      .select('*')
      .eq('organizationId', organizationId)
    
    if (error) throw error
    return data
  }

  // Get users by role
  static async findByRole(role) {
    const { data, error } = await supabase
      .from(userProfiles)
      .select('*')
      .eq('role', role)
    
    if (error) throw error
    return data
  }

  // Get completed courses for a user
  static async getCompletedCourses(userId) {
    const { data, error } = await supabase
      .from(userProfiles)
      .select('completed_courses')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data.completed_courses || []
  }

  // Get active courses for a user
  static async getActiveCourses(userId) {
    const { data, error } = await supabase
      .from(userProfiles)
      .select('active_courses')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data.active_courses || []
  }
}


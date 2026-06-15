import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useActivityLog(filters = {}, limit = 50) {
  return useQuery({
    queryKey: ['activity-log', filters, limit],
    queryFn: async () => {
      let query = supabase
        .from('activity_log')
        .select(`
          *,
          project:project_id (id, name),
          agent_instance:agent_instance_id (
            id, instance_name,
            agent_type:agent_type_id (name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id)
      }
      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type)
      }
      if (filters.agent_instance_id) {
        query = query.eq('agent_instance_id', filters.agent_instance_id)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

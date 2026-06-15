import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useAgentTypes() {
  return useQuery({
    queryKey: ['agent-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_types')
        .select('*')
        .order('name')
      if (error) throw error
      return data
    },
  })
}

export function useAgentInstances() {
  return useQuery({
    queryKey: ['agent-instances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_instances')
        .select(`
          *,
          agent_type:agent_type_id (
            id, name, icon, capabilities
          )
        `)
        .order('instance_name')
      if (error) throw error
      return data
    },
  })
}

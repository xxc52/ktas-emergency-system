import { createClient } from './supabase/client';

const supabase = createClient();

// 모든 구조대원 가져오기
export async function getAllRescuers() {
  try {
    const { data, error } = await supabase
      .from('rescuers')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching rescuers:', error);
    return [];
  }
}

// 새 구조대원 추가
export async function createRescuer(name) {
  try {
    const { data, error } = await supabase
      .from('rescuers')
      .insert([{ name }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating rescuer:', error);
    throw error;
  }
}

// 특정 구조대원 가져오기
export async function getRescuerById(id) {
  try {
    const { data, error } = await supabase
      .from('rescuers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching rescuer:', error);
    return null;
  }
}
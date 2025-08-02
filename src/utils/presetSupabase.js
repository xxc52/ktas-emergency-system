// 프리셋 관련 Supabase 유틸리티 함수들

import { createClient } from './supabase/client';

const supabase = createClient();

// 구조대원의 모든 프리셋 가져오기
export async function getPresetsByRescuer(rescuerId) {
  try {
    const { data, error } = await supabase
      .from('custom_presets')
      .select('*')
      .eq('rescuer_id', rescuerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('프리셋 조회 오류:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('프리셋 조회 중 예외:', error);
    return [];
  }
}

// 새 프리셋 저장
export async function createPreset(rescuerId, presetName, presetData) {
  try {
    const { data, error } = await supabase
      .from('custom_presets')
      .insert([{
        rescuer_id: rescuerId,
        preset_name: presetName,
        preset_data: presetData
      }])
      .select()
      .single();

    if (error) {
      console.error('프리셋 저장 오류:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('프리셋 저장 중 예외:', error);
    return null;
  }
}

// 프리셋 삭제
export async function deletePreset(presetId) {
  try {
    const { error } = await supabase
      .from('custom_presets')
      .delete()
      .eq('id', presetId);

    if (error) {
      console.error('프리셋 삭제 오류:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('프리셋 삭제 중 예외:', error);
    return false;
  }
}

// 초기 시스템 프리셋 생성 (화재상황, 심장마비)
export async function createSystemPresets(rescuerId) {
  const systemPresets = [
    {
      name: "🔥 화재상황",
      data: {
        category: "환경손상",
        disease: "연기흡입",
        firstConsiderations: ["호흡곤란", "의식장애"],
        secondConsiderations: ["그을음", "쉰목소리", "기침"]
      }
    },
    {
      name: "❤️ 심장마비",
      data: {
        category: "심혈관계",
        disease: "심정지",
        firstConsiderations: ["의식장애", "호흡이상"],
        secondConsiderations: ["무호흡", "청색증"]
      }
    }
  ];

  const results = [];
  
  for (const preset of systemPresets) {
    const result = await createPreset(rescuerId, preset.name, preset.data);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

// 구조대원이 프리셋을 가지고 있는지 확인
export async function hasPresets(rescuerId) {
  try {
    const { count, error } = await supabase
      .from('custom_presets')
      .select('*', { count: 'exact', head: true })
      .eq('rescuer_id', rescuerId);

    if (error) {
      console.error('프리셋 확인 오류:', error);
      return false;
    }

    return count > 0;
  } catch (error) {
    console.error('프리셋 확인 중 예외:', error);
    return false;
  }
}
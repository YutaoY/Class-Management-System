<template>
  <div class="members-list">
    <div class="member-tag" v-for="item in list" :key="item.id">
      <!-- <el-icon >
        <Female v-if="userinfo(item).sex === UserSex.FEMALE"  />
        <Male v-else-if="userinfo(item).sex === UserSex.MALE" />
      </el-icon> -->
      <span>{{ userinfo(item).name }}</span>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { UserSex } from '@/enums/appEnum';
import { AttendanceType } from '@/types/store';
import { userData } from '@/utils/data';
import { Female, Male } from '@element-plus/icons-vue'

const userinfo = computed(() => (item: AttendanceType) => {
  return userData.value.use(item.id)
})

const { list } = defineProps({
  list: {
    type: Object as () => AttendanceType[],
    default: [],
  }
});
</script>

<style lang="scss" scoped>
.members-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.member-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #f7fafc;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}
</style>